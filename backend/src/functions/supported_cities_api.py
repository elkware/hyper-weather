import json


def lambda_handler(event, context):
    cities = json.load(open('supported_cities.json', 'r'))
    return {
        'statusCode': 200,
        'body': json.dumps(cities),
        'headers': {
            'Content-Type': 'application/json'
        }
    }