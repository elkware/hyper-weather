import json
import boto3


table = boto3.resource("dynamodb").Table("hyperweather_location_report_data")
s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    Lambda handler to handle the forecast summary api through API Gateway
    """
    query_string = event["queryStringParameters"]
    if not query_string:
        return {
            "statusCode": 400,
            "body": "Missing mandatory location and date query parameter",
        }
    location = query_string.get("location")
    if not location:
        return {"statusCode": 400, "body": "Missing mandatory location query parameter"}

    date = query_string.get("date")
    if not date:
        return {"statusCode": 400, "body": "Missing mandatory date query parameter"}
    location = location.replace(" ", "_").replace(",", "").lower()
    item = table.get_item(Key={"location": location, "date": date})
    summary = item.get("Item")
    if not summary:
        return {"statusCode": 404, "body": f"No forecast summary for {location}"}
    
    try:
        url = s3.generate_presigned_url(
            ClientMethod='get_object',
            Params={
                'Bucket': 'hyperweather-tts',
                'Key': f'{summary["date"]}/{summary["location"]}.mp3'
            },
            ExpiresIn=3600  # The URL will expire in 1 hour (3600 seconds)
        )
        summary['report_tts_url'] = url
    except Exception as e:
        print(e)
        
    return {
        "statusCode": 200,
        "body": json.dumps(summary),
        "headers": {"Content-Type": "application/json"},
    }
