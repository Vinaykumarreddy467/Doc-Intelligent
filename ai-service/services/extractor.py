"""Field Extraction Service"""
import httpx
import json
import logging
from config import settings

logger = logging.getLogger(__name__)

def extract_fields(text: str, doc_type: str) -> dict:
    """Extract key fields from document using Ollama"""
    
    prompt = f"""Extract key fields from this {doc_type} document.
Return ONLY a JSON object with the extracted fields.

Document:
{text[:3000]}

Response:"""

    try:
        response = httpx.post(
            f"{settings.ollama_base_url}/api/generate",
            json={
                "model": settings.ollama_model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_predict": 300
                }
            },
            timeout=60.0
        )
        result = response.json()
        response_text = result.get("response", "")
        
        try:
            parsed = json.loads(response_text)
            return parsed
        except json.JSONDecodeError:
            return {"raw_extraction": response_text[:500]}
            
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        return {}
