import os
import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")
MODEL_ID = os.getenv("MODEL_ID")

# Kita butuh model ID untuk merapikan teks (pastikan model ini memiliki akses di AWS-mu)
#MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0" 

def get_bedrock_agent_runtime_client():
    return boto3.client(
        service_name="bedrock-agent-runtime",
        region_name=AWS_REGION,
    )

def get_bedrock_runtime_client():
    return boto3.client(
        service_name="bedrock-runtime",
        region_name=AWS_REGION,
    )

def retrieve_and_generate(query: str) -> dict:
    if not KNOWLEDGE_BASE_ID:
        raise ValueError("KNOWLEDGE_BASE_ID is not set.")

    # 1. RETRIEVE
    agent_client = get_bedrock_agent_runtime_client()
    try:
        response = agent_client.retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={"text": query},
            retrievalConfiguration={
                "managedSearchConfiguration": {
                    "numberOfResults": 5,
                },
            },
        )
    except Exception as e:
        raise ValueError(f"Gagal menarik dokumen dari Knowledge Base: {e}")

    snippets = []
    sources = set()

    for result in response.get("retrievalResults", []):
        text = result.get("content", {}).get("text", "").strip()
        if text:
            snippets.append(text)
        
        location = result.get("location", {})
        if location.get("type") == "S3":
            s3_uri = location.get("s3Location", {}).get("uri", "")
            if s3_uri:
                file_name = s3_uri.split("/")[-1]
                sources.add(file_name)

    context_text = "\n\n".join(snippets)

    if not context_text:
        return {
            "sources": []
        }

    # 2. GENERATE
    llm_client = get_bedrock_runtime_client()
    
    prompt = f"""
Anda adalah asisten travel profesional. 
TUGAS UTAMA: Jawab pertanyaan pengguna HANYA berdasarkan referensi di bawah ini.
Jika jawabannya tidak ada di referensi, katakan "Maaf, informasi ini tidak ada di dokumen panduan Anda."
Jangan pernah mengarang informasi tambahan.

<referensi>
{context_text}
</referensi>

Pertanyaan pengguna: "{query}"

INSTRUKSI FORMAT WAJIB (MARKDOWN):
- Gunakan struktur Markdown yang rapi.
- Wajib gunakan bullet points (-) atau penomoran (1. 2.).
- Cetak tebal (**bold**) pada kata kunci penting.
- Beri spasi paragraf antar poin agar mudah dibaca.
"""

    try:
        llm_response = llm_client.converse(
            modelId=MODEL_ID,
            messages=[{
                "role": "user",
                "content": [{"text": prompt}]
            }]
        )
        answer = llm_response['output']['message']['content'][0]['text']
    except Exception as e:
        # KITA MENGUBAH BAGIAN INI: Lemparkan error ke UI agar tidak disembunyikan
        raise ValueError(f"Proses Generate (merapikan teks) gagal. Error dari Bedrock: {e}")

    return {
        "answer": answer,
        "sources": list(sources)
    }