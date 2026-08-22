import os
import boto3
from dotenv import load_dotenv

# Memuat variabel environment dari file .env
load_dotenv()

def get_bedrock_client():
    # Mengonfigurasi dan mengembalikan client AWS Bedrock.
    client = boto3.client(
        service_name='bedrock-runtime',
        region_name=os.getenv("AWS_REGION", "ap-southeast-2")
    )
    return client

def get_ai_recommendation(days: int, destination: str, budget: float, travel_style: str):
    client = get_bedrock_client()
    prompt = f"""You are an experienced travel planner.
        Plan a {days}-day itinerary for {destination}.
        Budget: {budget} based on currency of destination.
        Travel Style: {travel_style}.

        Please ensure your response specifically includes:
        - Daily itinerary structured as follows:
        * Morning activities: Provide 2-3 specific activities per day.
        * Afternoon activities: Include cultural sites and local experiences.
        * Evening activities: Add dinner spots and nightlife suggestions.
        - Estimated daily budget
        - Local food recommendations
        - Transportation suggestions

        Please give the answer in markdown format and use bulleted lists."""

    model_id = os.getenv("MODEL_ID", "amazon.nova-lite-v1:0")

    try:
        response = client.converse(
            modelId=model_id,
            messages=[
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ],
            inferenceConfig={
                "maxTokens": 1500
            }
        )
        
        # Membaca hasil respons dari struktur Converse API
        ai_text_response = response['output']['message']['content'][0]['text']
        
        return ai_text_response
        
    except Exception as e:
        print(f"Error saat memanggil AWS Bedrock: {e}")
        return None