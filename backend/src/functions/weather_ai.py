import os
import boto3
from boto3.dynamodb.conditions import Key
import urllib3
import json
from datetime import datetime
from decimal import Decimal


hyperweather_data_table = boto3.resource("dynamodb").Table("hyperweather_data")

OPEN_AI_API_KEY = os.environ["OPEN_AI_API_KEY"]
OPEN_AI_CHATGPT_API = "https://api.openai.com/v1/chat/completions"


HTTP_CONNECTION_POOL = urllib3.PoolManager()


def generate_weahter_ai_response(prompt):
    response = HTTP_CONNECTION_POOL.request(
        "POST",
        OPEN_AI_CHATGPT_API,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPEN_AI_API_KEY}",
        },
        body=json.dumps(
            {
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": prompt}],
            }
        ),
    )
    if response.status != 200:
        raise Exception("OpenAI API call failed")

    data = json.loads(response.data.decode("utf-8"))
    return data["choices"][0]["message"]["content"]


def fetch_data_for_today(location, date):
    day_start = Decimal(datetime(date.year, date.month, date.day, 0, 0, 0).timestamp())
    day_end = Decimal(datetime(date.year, date.month, date.day, 23, 59, 59).timestamp())
    response = hyperweather_data_table.query(
        KeyConditionExpression=Key("location").eq(location) & Key("timestamp").between(day_start, day_end)
    )
    return response.get("Items")


def prepare_prompt(data):
    for item in data:
        item["wind_from_direction"] = wind_direction_to_text(item.pop("wind_from_direction"))
    chunks = [data[i : i + 6] for i in range(0, len(data), 6)]
    prompts = ["Generate a short weater report for the next 24 hours. "]
    for day_part, chunk in zip(["00:00 to 06:00", "06:00 to 12:00", "12:00 to 18:00", "18:00 to 23:59"], chunks):
        prompt = f"Conditions from {day_part} "
        min_temp = min([item["air_temperature"] for item in chunk])
        max_temp = max([item["air_temperature"] for item in chunk])
        prompt += f"will be between {min_temp} and {max_temp} degrees Celsius, "
        min_air_pressure = min([item["air_pressure_at_sea_level"] for item in chunk])
        max_air_pressure = max([item["air_pressure_at_sea_level"] for item in chunk])
        prompt += f"with an air pressure between {min_air_pressure} and {max_air_pressure} hectopascals, "
        min_wind_speed = min([item["wind_speed"] for item in chunk])
        max_wind_speed = max([item["wind_speed"] for item in chunk])
        prompt += f"a wind speed between {min_wind_speed} and {max_wind_speed} meters per second, "
        min_relative_humidity = min([item["relative_humidity"] for item in chunk])
        max_relative_humidity = max([item["relative_humidity"] for item in chunk])
        prompt += f"and a relative humidity between {min_relative_humidity} and {max_relative_humidity} percent. "
        min_precipitation_amount = min([item["precipitation_amount"] for item in chunk])
        max_precipitation_amount = max([item["precipitation_amount"] for item in chunk])
        if min_precipitation_amount == 0 and max_precipitation_amount == 0:
            prompt += "There will be no precipitation. "
        else:
            prompt += (
                f"Rainfall will be between {min_precipitation_amount} and {max_precipitation_amount} millimeters. "
            )
        winds = set([item["wind_from_direction"] for item in chunk])
        if len(winds) == 1:
            prompt += f"The wind will be coming from the {winds.pop()}. "
        else:
            prompt += f"The wind will be coming from the {', '.join(winds)} directions. "
        min_cloud_area_fraction = min([item["cloud_area_fraction"] for item in chunk])
        max_cloud_area_fraction = max([item["cloud_area_fraction"] for item in chunk])
        if min_cloud_area_fraction == 0 and max_cloud_area_fraction == 0:
            prompt += "There will be no cloud cover. "
        else:
            prompt += f"Cloud cover will be between {min_cloud_area_fraction} and {max_cloud_area_fraction} percent. "

        prompts.append(prompt)

    return "".join(prompts)


def wind_direction_to_text(direction):
    if direction < 22.5:
        return "north"
    elif direction < 67.5:
        return "north-east"
    elif direction < 112.5:
        return "east"
    elif direction < 157.5:
        return "south-east"
    elif direction < 202.5:
        return "south"
    elif direction < 247.5:
        return "south-west"
    elif direction < 292.5:
        return "west"
    elif direction < 337.5:
        return "north-west"
    else:
        return "north"


def get_or_create_location_report_table():
    """
    Get or create the dynamodb table
    """
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("hyperweather_location_report_data")
    try:
        table.load()
    except Exception as e:
        table = dynamodb.create_table(
            TableName="hyperweather_location_report_data",
            KeySchema=[{"AttributeName": "location", "KeyType": "HASH"}, {"AttributeName": "date", "KeyType": "RANGE"}],
            AttributeDefinitions=[
                {"AttributeName": "location", "AttributeType": "S"},
                {"AttributeName": "date", "AttributeType": "S"},
            ],
            ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        )
        table.meta.client.get_waiter("table_exists").wait(TableName="hyperweather_location_report_data")
    return table


def generate_forcast_report():
    date = datetime.now()
    report_table = get_or_create_location_report_table()
    for city in json.load(open("supported_cities.json", "r")):
        location = city["name"].replace(" ", "_").lower() + "_" + city["country"].replace(" ", "_").lower()
        print(f'Generating report for {location} for {date.strftime("%Y-%m-%d")}')
        item = report_table.get_item(Key={"location": location, "date": date.strftime("%Y-%m-%d")})

        if "Item" in item:
            print("Report already exists")
            continue

        data = fetch_data_for_today(location, date)
        prompt = prepare_prompt(data)
        report = generate_weahter_ai_response(prompt)
        report_table.put_item(Item={"location": location, "date": date.strftime("%Y-%m-%d"), "report": report})


def lambda_handler(event, context):  # noqa
    generate_forcast_report()
