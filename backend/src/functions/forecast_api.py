import json
import boto3
from boto3.dynamodb.conditions import Key
from collections.abc import Mapping, Iterable
from decimal import Decimal
from datetime import datetime


table = boto3.resource("dynamodb").Table("hyperweather_data")


class DecimalEncoder(json.JSONEncoder):
    def encode(self, obj):
        if isinstance(obj, Mapping):
            return "{" + ", ".join(f"{self.encode(k)}: {self.encode(v)}" for (k, v) in obj.items()) + "}"
        if isinstance(obj, Iterable) and (not isinstance(obj, str)):
            return "[" + ", ".join(map(self.encode, obj)) + "]"
        if isinstance(obj, Decimal):
            return f"{obj.normalize():f}"
        return super().encode(obj)


def lambda_handler(event, context):
    """
    Lambda handler to handle the forecast api through API Gateway
    """
    query_string = event["queryStringParameters"]
    if not query_string:
        return {"statusCode": 400, "body": "Missing mandatory location query parameter"}
    location = query_string.get("location")
    if not location:
        return {"statusCode": 400, "body": "Missing mandatory location query parameter"}

    from_current_timestamp = (
        True
        if query_string.get("from_current_timestamp") and query_string["from_current_timestamp"].lower() == "true"
        else False
    )
    forecast = get_forecast_for_city(location.replace(" ", "_").replace(",", "").lower(), from_current_timestamp)
    if not forecast:
        return {"statusCode": 404, "body": "No forecast found for location"}

    return {
        "statusCode": 200,
        "body": json.dumps(forecast, cls=DecimalEncoder),
        "headers": {"Content-Type": "application/json"},
    }


def get_forecast_for_city(location, from_current_timestamp):
    """
    Get the forecast for a city
    """

    key_condition_expression = Key("location").eq(location)
    if from_current_timestamp:
        from_timestamp = datetime.now().timestamp()
        key_condition_expression = key_condition_expression & Key("timestamp").gte(Decimal(from_timestamp))
    response = table.query(KeyConditionExpression=key_condition_expression)
    return response.get("Items")
