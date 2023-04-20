import urllib3
import boto3
import json
from datetime import datetime
from decimal import Decimal


http = urllib3.PoolManager()


def lambda_handler(event, context):
    """
    Lambda handler
    """
    data = retrieve_weather_data()
    save_met_no_data(data)
    return {"statusCode": 200, "body": json.dumps("Data fetched and saved")}


def retrieve_weather_data():
    """
    Retrieve the weather data from the met.no api and format it for dynamodb.

    Returns:
        list: A genertor of weather data items per city
    """
    for city in json.load(open("supported_cities.json", "r")):
        try:
            data = json.loads(
                http.request(
                    method="GET",
                    url=f'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat={city["lat"]}&lon={city["lon"]}',
                    headers={"User-Agent": "HyperWeather/0.1 github.com/elkware/hyper-weather"},
                ).data.decode("utf-8"),
                parse_float=Decimal,
            )
        except Exception as e:
            print(e)
            continue
        items = []
        for time_point in data["properties"]["timeseries"]:
            details = time_point["data"]["instant"]["details"]
            details["location"] = (
                city["name"].replace(" ", "_").lower() + "_" + city["country"].replace(" ", "_").lower()
            )
            details["timestamp"] = Decimal(
                datetime.fromisoformat(time_point["time"].replace("Z", "+00:00")).timestamp()
            )
            next_details = (
                time_point["data"].get("next_1_hours")
                or time_point["data"].get("next_6_hours")
                or time_point["data"].get("next_12_hours")
            )
            if next_details:
                details["precipitation_amount"] = next_details["details"]["precipitation_amount"]
                details["symbol_code"] = next_details["summary"]["symbol_code"]
            else:
                details["precipitation_amount"] = items[-1]["precipitation_amount"]
                details["symbol_code"] = items[-1]["symbol_code"]
            items.append(details)
        yield items


def get_or_create_dynamodb_table():
    """
    Get or create the dynamodb table
    """
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("hyperweather_data")
    try:
        table.load()
    except Exception as e:
        print(e)
        table = dynamodb.create_table(
            TableName="hyperweather_data",
            KeySchema=[
                {"AttributeName": "location", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "location", "AttributeType": "S"},
                {"AttributeName": "timestamp", "AttributeType": "N"},
            ],
            ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        )
        table.meta.client.get_waiter("table_exists").wait(TableName="hyperweather_data")
    return table


def save_met_no_data(data):
    """
    Save the data to the dynamodb table
    """
    table = get_or_create_dynamodb_table()
    for city_data in data:
        with table.batch_writer() as batch:
            for item in city_data:
                batch.put_item(Item=item)
