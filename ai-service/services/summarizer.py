"""Document Summarization Service"""
import httpx
import logging
from config import settings

logger = logging.getLogger(__name__)

def summarize_document(text: str) -> str:
    """Summarize document using Ollama"""
    prompt = f"""Summarize the following document in 2-3 sentences:

{text[:3000]}

Summary:"""

    try:
        response = httpx.post(
            f"{settings.ollama_base_url}/api/generate",
            json={
                "model": settings.ollama_model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "num_predict": 200
                }
            },
            timeout=60.0
        )
        result = response.json()
        return result.get("response", "").strip()
        
    except Exception as e:
        logger.error(f"Summarization error: {e}")
        return ""
