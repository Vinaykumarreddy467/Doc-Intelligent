"""Document Classification Service"""
import httpx
import json
import logging
from config import settings

logger = logging.getLogger(__name__)

DOCUMENT_TYPES = [
    "invoice", "contract", "receipt", "letter", "report",
    "email", "form", "resume", "other"
]

def classify_document(text: str) -> dict:
    """Classify document type using Ollama"""
    prompt = f"""Classify the following document into one of these categories: {", ".join(DOCUMENT_TYPES)}.
Return ONLY a JSON object with "type" and "confidence" fields.

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
                    "num_predict": 100
                }
            },
            timeout=300.0
        )
        result = response.json()
        response_text = result.get("response", "")
        
        # Parse JSON from response
        try:
            parsed = json.loads(response_text)
            return {
                "type": parsed.get("type", "other"),
                "confidence": parsed.get("confidence", 0.5)
            }
        except json.JSONDecodeError:
            # Fallback: extract type from text
            for doc_type in DOCUMENT_TYPES:
                if doc_type.lower() in response_text.lower():
                    return {"type": doc_type, "confidence": 0.6}
            return {"type": "other", "confidence": 0.3}
            
    except Exception as e:
        logger.error(f"Classification error: {e}")
        return {"type": "other", "confidence": 0.0}
