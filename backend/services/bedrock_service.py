import os
import boto3
from dotenv import load_dotenv

# Memuat variabel environment dari file .env
load_dotenv()

def get_bedrock_client():
    # Mengonfigurasi dan mengembalikan client AWS Bedrock.
    # Default ke ap-southeast-2 agar konsisten dengan kb_service
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

            Please ensure your response specifically includes exactly these sections:
            
            1. Daily itinerary: (Provide a clear day-by-day breakdown)
            * Morning activities: Provide 2-3 specific activities per day.
            * Afternoon activities: Include cultural sites and local experiences.
            * Evening activities: Add dinner spots and nightlife suggestions.
            2. Travel tips section: (Include transportation, weather, or cultural tips)
            3. Local food recommendations: (Must-try local dishes and restaurants)
            4. Estimated budget breakdown: (Show how the {budget} budget is allocated across the {days} days)

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
                "maxTokens": 4096
            }
        )
        
        # Membaca hasil respons dari struktur Converse API
        ai_text_response = response['output']['message']['content'][0]['text']
        
        return ai_text_response
        
    except Exception as e:
        print(f"Error saat memanggil AWS Bedrock: {e}")
        return None