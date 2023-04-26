import boto3


polly_client = boto3.client("polly")
s3_client = boto3.client("s3")


def call_polly_and_save_to_s3(location, date, text):
    response = polly_client.synthesize_speech(
        Text=f'<speak><amazon:domain name="news">{text}</amazon:domain></speak>',
        OutputFormat="mp3",
        VoiceId="Amy",
        TextType="ssml",
        Engine="neural",
    )
    s3_client.put_object(
        Body=response["AudioStream"].read(),
        Bucket="hyperweather-tts",
        Key=f"{date}/{location}.mp3",
    )


def lambda_handler(event, context):
    """
    Lambda to handle the stream from dynamo db.
    """
    for record in event["Records"]:
        if record["eventName"] == "INSERT":
            new_image = record["dynamodb"]["NewImage"]
            location = new_image["location"]["S"]
            date = new_image["date"]["S"]
            report = new_image["report"]["S"]
            call_polly_and_save_to_s3(location, date, report)
