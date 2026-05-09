"""Document Summarization Service"""
import httpx
import logging
from config import settings

logger = logging.getLogger(__name__)

def summarize_document(text: str) -> str:
    """Generate a concise summary of the document using Ollama"""
    
    text_sample = text[:5000] if text else ""
    
    prompt = f"""Read the document below and write a clear, informative summary (2-4 sentences).
Focus on: what the document IS (type), who it involves, key dates, and important figures/amounts.

DOCUMENT:
{text_sample}

SUMMARY:"""

    try:
        response = httpx.post(
            f"{settings.ollama_base_url}/api/generate",
            json={
                "model": settings.ollama_model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_predict": 250
                }
            },
            timeout=300.0
        )
        result = response.json()
        summary = result.get("response", "").strip()
        
        # Clean up the summary
        if summary.startswith("SUMMARY:"):
            summary = summary[8:].strip()
        if summary.startswith('"') and summary.endswith('"'):
            summary = summary[1:-1]
        
        return summary
        
    except Exception as e:
        logger.error(f"Summarization error: {e}")
        return ""
