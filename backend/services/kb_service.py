import os
import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-2")
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")
MODEL_ID = os.getenv("MODEL_ID", "amazon.nova-lite-v1:0")

def get_bedrock_agent_runtime_client():
    return boto3.client(service_name="bedrock-agent-runtime", region_name=AWS_REGION)

def get_bedrock_runtime_client():
    return boto3.client(service_name="bedrock-runtime", region_name=AWS_REGION)

def retrieve_and_generate(query: str, chat_history: list = None) -> dict:
    if not KNOWLEDGE_BASE_ID:
        raise ValueError("KNOWLEDGE_BASE_ID is not set.")

    # 1. RETRIEVE DARI KNOWLEDGE BASE
    agent_client = get_bedrock_agent_runtime_client()
    try:
        response = agent_client.retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={"text": query},
            retrievalConfiguration={"managedSearchConfiguration": {"numberOfResults": 5}}
        )
    except Exception as e:
        raise ValueError(f"Gagal menarik dokumen dari Knowledge Base: {e}")

    snippets = []
    sources = set()
    for result in response.get("retrievalResults", []):
        text = result.get("content", {}).get("text", "").strip()
        if text: snippets.append(text)
        
        location = result.get("location", {})
        if location.get("type") == "S3" and location.get("s3Location", {}).get("uri"):
            sources.add(location["s3Location"]["uri"].split("/")[-1])

    context_text = "\n\n".join(snippets)

    # 2. SUSUN PROMPT DENGAN FORMAT XML KHUSUS CLAUDE (Sangat Kuat!)
    prompt_text = f"""<user_query>
{query}
</user_query>

<search_results>
{context_text if context_text else 'No documents found'}
</search_results>

<system_instructions>
You are KelanaAI, a smart travel assistant. You are currently in the middle of a chat with a user.

CRITICAL WARNING:
Our search engine system frequently makes mistakes! It often retrieves <search_results> from the wrong country due to keyword similarities (e.g., searching for the phrase "day 1").

YOUR TASK:
1. READ our chat history above. Identify which COUNTRY or CITY we are discussing (e.g., Japan, North Korea, etc.).
2. EVALUATE the content of <search_results>. IF the document content discusses a DIFFERENT country/city from the chat history (e.g., THEN CONSIDER THAT DOCUMENT AS TRASH! IGNORE IT 100%!
3. Answer <user_query> purely by continuing the plan from the CORRECT destination in the chat history. Do not get carried away by search engine hallucinations!
Use Markdown format.
</system_instructions>
"""

    # 3. SIAPKAN RAW MESSAGES
    raw_messages = []
    if chat_history:
        for msg in chat_history:
            content_str = msg.content.strip() if msg.content else ""
            if not content_str: continue 
            
            role = "assistant" if msg.role in ["assistant", "ai"] else "user"
            raw_messages.append({"role": role, "content": content_str})

    # Aturan Ketat Bedrock: Hindari bentrokan user -> user
    if raw_messages and raw_messages[-1]["role"] == "user":
        raw_messages[-1]["content"] += f"\n\n[Pesan Baru]:\n{prompt_text}"
    else:
        raw_messages.append({"role": "user", "content": prompt_text})

    # 4. TERAPKAN LIST COMPREHENSION BEDROCK
    bedrock_messages = [
        {
            "role": item["role"],
            "content": [{"text": item["content"]}],
        }
        for item in raw_messages
    ]

    # 5. GENERATE
    llm_client = get_bedrock_runtime_client()
    try:
        llm_response = llm_client.converse(
            modelId=MODEL_ID,
            messages=bedrock_messages 
        )
        answer = llm_response['output']['message']['content'][0]['text']
    except Exception as e:
        raise ValueError(f"Proses Generate gagal. Error dari Bedrock: {e}")

    # Logika tambahan: Jika AI memutuskan untuk mengabaikan dokumen (karena beda negara), 
    # kita tidak perlu menampilkan nama dokumen Kazakhstan tersebut di layar UI.
    if "Kazakhstan" in answer or "Astana" in answer or "Nur-Sultan" in answer:
         pass # Biarkan saja jika memang obrolannya ttg Kazakhstan
    else:
         # Jika jawaban membahas Korea/Jepang tapi referensi ditarik dari Kazakhstan, kosongkan referensinya
         if context_text and ("Kazakhstan" in context_text or "Nur-Sultan" in context_text):
             sources = set()

    return {
        "answer": answer,
        "sources": list(sources)
    }