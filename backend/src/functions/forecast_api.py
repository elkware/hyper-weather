import json
import boto3
from boto3.dynamodb.conditions import Key
from collections.abc import Mapping, Iterable
from decimal import Decimal


table = boto3.resource('dynamodb').Table('hyperweather_data')


class DecimalEncoder(json.JSONEncoder):
    def encode(self, obj):
        if isinstance(obj, Mapping):
            return '{' + ', '.join(f'{self.encode(k)}: {self.encode(v)}' for (k, v) in obj.items()) + '}'
        if isinstance(obj, Iterable) and (not isinstance(obj, str)):
            return '[' + ', '.join(map(self.encode, obj)) + ']'
        if isinstance(obj, Decimal):
            return f'{obj.normalize():f}'  # using normalize() gets rid of trailing 0s, using ':f' prevents scientific notation
        return super().encode(obj)
    

def lambda_handler(event, context):
    """
    Lambda handler to handle the forecast api through API Gateway
    """
    query_string = event['queryStringParameters']
    if not query_string:
        return {
            'statusCode': 400,
            'body': 'Missing location parameter'
        }
    location = query_string.get('location')
    if not location:
        return {
            'statusCode': 400,
            'body': 'Missing location parameter'
        }
    location = location.replace(' ', '_').replace(',', '').lower()
    forecast = get_forecast_for_city(location)
    if not forecast:
        return {
            'statusCode': 404,
            'body': 'No forecast found for location'
        }


    return {
        'statusCode': 200,
        'body': json.dumps(forecast, cls=DecimalEncoder),
        'headers': {
            'Content-Type': 'application/json'
        }
    }


def get_forecast_for_city(location):
    """
    Get the forecast for a city
    """

    response = table.query(
        KeyConditionExpression=Key('location').eq(location),
    )
    return response['Items']
