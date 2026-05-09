"""Field Extraction Service"""
import httpx
import json
import re
import logging
from config import settings

logger = logging.getLogger(__name__)

# Expected fields for each document type
FIELD_TEMPLATES = {
    "invoice": ["invoice_number", "invoice_date", "due_date", "vendor_name", "vendor_address",
                "customer_name", "customer_address", "subtotal", "tax", "total", "payment_terms",
                "line_items", "currency", "po_number"],
    "contract": ["contract_title", "parties", "effective_date", "term_duration", "payment_terms",
                 "governing_law", "signature_date", "contract_value", "renewal_terms",
                 "confidentiality_clause", "termination_clause"],
    "certificate": ["certificate_title", "recipient_name", "issuing_organization", "issue_date",
                    "expiry_date", "certificate_id", "description", "level_or_grade",
                    "credential_type", "signatory_name"],
    "receipt": ["store_name", "store_address", "receipt_number", "receipt_date", "items",
                "subtotal", "tax", "total", "payment_method", "cashier"],
    "resume": ["name", "email", "phone", "address", "professional_summary", "work_experience",
               "education", "skills", "certifications", "languages", "references"],
    "letter": ["date", "recipient_name", "recipient_address", "salutation", "subject",
               "body", "closing", "signature", "sender_name", "sender_title"],
    "report": ["report_title", "author", "date", "organization", "executive_summary",
               "sections", "conclusions", "recommendations", "appendix"],
    "memo": ["to", "from", "date", "subject", "cc", "body", "priority"],
    "proposal": ["proposal_title", "client_name", "prepared_by", "date", "scope_of_work",
                 "deliverables", "timeline", "budget", "terms", "validity_period"],
    "email": ["from", "to", "cc", "subject", "date", "body", "attachments"],
    "form": ["form_title", "form_id", "fields", "submission_date", "applicant_name"],
}


def extract_fields(text: str, doc_type: str) -> dict:
    """Extract key fields from document based on its type"""
    
    text_sample = text[:5000] if text else ""
    expected_fields = FIELD_TEMPLATES.get(doc_type, ["content", "date", "author"])
    
    # Build field guidance
    field_guide = "\n".join([f"  - {f}" for f in expected_fields])
    
    prompt = f"""Extract the most important fields from this {doc_type} document.
Return ONLY a valid JSON object with these possible fields:
{field_guide}

If a field is not found, omit it from the JSON. Only include fields that have clear values in the text.

DOCUMENT:
{text_sample}

RESPONSE (JSON only):"""

    try:
        response = httpx.post(
            f"{settings.ollama_base_url}/api/generate",
            json={
                "model": settings.ollama_model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.05,
                    "num_predict": 400
                }
            },
            timeout=300.0
        )
        result = response.json()
        response_text = result.get("response", "").strip()
        
        # Try to parse JSON
        json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                return parsed
            except json.JSONDecodeError:
                pass
        
        # Fallback: try parsing the whole response as JSON
        try:
            parsed = json.loads(response_text)
            return parsed
        except json.JSONDecodeError:
            logger.warning(f"Could not parse extraction JSON: {response_text[:100]}")
            return {"raw_extraction": response_text[:500]}
        
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        return {}
