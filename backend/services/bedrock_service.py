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

def get_ai_recommendation(days: int, destination: str, budget: float, travel_style: str, travel_year: int = 2025):
    client = get_bedrock_client()
    prompt = f"""You are an expert travel planner with deep knowledge of hotels, transport, and local experiences.

Plan a detailed {days}-day trip to {destination} in {travel_year}.
Daily Budget per person: {budget} (use the currency of the destination country).
Travel Style: {travel_style}.

Your response MUST include ALL of the following sections in this exact order, using markdown headers (##):

## ✈️ Transport to Destination
- Recommend the best mode of transport to reach {destination} (plane, train, ship, bus, etc.) based on the budget.
- For flights: list 2-3 specific airlines that operate this route, estimated ticket price range, and flight duration.
- For trains/ships: list the operator, class options, estimated price, and travel duration.
- Include departure city options from major Indonesian cities (Jakarta, Surabaya, Bali) if applicable.

## 🏨 Hotel Recommendations
- Recommend 3 hotels suitable for the budget category ({travel_style}).
- For EACH hotel include:
  * Full hotel name
  * Complete address (street name, district/area, city)
  * Price per night in local currency
  * Why it suits this travel style

## 📅 Daily Itinerary
For each day (Day 1 through Day {days}), provide:
- **Morning**: 2-3 specific activities with location names
- **Afternoon**: Cultural sites, landmarks, or local experiences
- **Evening**: Dinner spots (restaurant name + address) and evening activities
- Include local transport tips for getting around each day (taxi, MRT, tuk-tuk, etc. with estimated cost)

## 🍽️ Local Food Recommendations
- List 5-7 must-try dishes with the name of a specific restaurant and its address where to find them.

## 💡 Travel Tips
- Best time to visit in {travel_year}
- Weather and what to pack
- Cultural customs and etiquette
- Safety tips and emergency contacts

## 💰 Budget Breakdown
Show a detailed day-by-day budget allocation of the total {budget} x {days} days:
- Transport to destination
- Accommodation (hotel cost per night x {days} nights)
- Daily meals
- Activities and entrance fees
- Local transport
- Miscellaneous / emergency fund
- Total estimated spend vs budget

Use markdown format with bullet points. Be specific with names, addresses, and prices."""

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