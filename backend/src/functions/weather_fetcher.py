import urllib3
import boto3



def fetch_data():
    """
    Fetch the data using the met.no API
    """
    http = urllib3.PoolManager()
    r = http.request(
        method='GET',
        url='https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91273&lon=10.74609', 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'}
    )
    return r.data 


def save_met_no_data(data):
    """
    Save the data to the dynamodb table
    """
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('met_no_data')
    table.put_item(
        Item={
            'id': 'met_no_data',
            'data': data
        }
    )
