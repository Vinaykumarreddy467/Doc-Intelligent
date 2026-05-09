"""Document Classification Service"""
import httpx
import json
import re
import logging
from config import settings

logger = logging.getLogger(__name__)

DOCUMENT_TYPES = [
    "invoice", "contract", "certificate", "receipt", "resume",
    "letter", "report", "memo", "proposal", "email", "form", "other"
]

# Distinguishing keywords for each document type — broader coverage
TYPE_KEYWORDS = {
    "invoice": ["invoice", "inv-", "invoice number", "due date", "payment terms", "total due",
                "subtotal", "amount due", "bill to", "purchase order", "po number", "tax",
                "line item", "unit price", "quantity", "net 30", "payable"],
    "contract": ["agreement", "hereinafter", "party of the", "witnesseth", "indemnify",
                 "governing law", "breach", "termination", "confidentiality", "hereby agree",
                 "force majeure", "exhibit", "schedule a", "binding", "executed"],
    "certificate": ["certificate", "certify", "certified", "awarded to", "this certifies",
                    "date of issue", "completion", "achievement", "accredited", "credential",
                    "certification", "ssc examination", "board of secondary", "passed",
                    "distinction", "grade", "gpa", "qualified", "diploma", "degree"],
    "receipt": ["receipt", "payment", "paid", "transaction", "cash", "credit", "debit",
                "thank you for your", "change due", "amount tendered", "store receipt",
                "cashier", "register", "customer copy"],
    "resume": ["resume", "curriculum vitae", "cv", "work experience", "education",
               "skills", "references", "professional summary", "employment history",
               "objective", "qualifications", "bachelor", "master", "phd"],
    "letter": ["dear ", "sincerely", "yours truly", "regards", "re:", "subject:",
               "to whom it may concern", "correspondence", "enclosure"],
    "report": ["report", "executive summary", "findings", "analysis", "conclusion",
               "recommendation", "methodology", "appendix", "table of contents",
               "introduction", "background"],
    "memo": ["memo", "memorandum", "to:", "from:", "cc:", "re:", "subject:",
             "distribution", "interoffice", "confidential"],
    "proposal": ["proposal", "proposed", "scope of work", "statement of work", "deliverables",
                 "timeline", "budget", "project plan", "objectives", "solution"],
    "email": ["from:", "to:", "subject:", "sent:", "cc:", "bcc:", "message-id:",
              "forwarded message", "original message", "reply to"],
    "form": ["form", "please fill", "application", "registration", "questionnaire",
             "please complete", "field", "signature required", "date of birth"],
}

# Strong single-keyword indicators that uniquely identify a type
TYPE_SIGNATURE_KEYWORDS = {
    "certificate": ["this certifies", "this certificate", "certificate of", "certified that",
                    "ssc examination", "board of secondary education", "ssc exam",
                    "certificate of achievement", "awarded this certificate"],
    "invoice": ["invoice number", "invoice #", "total due", "payment terms", "net 30"],
    "contract": ["hereinafter", "witnesseth", "force majeure", "governing law"],
    "receipt": ["amount tendered", "change due", "customer copy", "store receipt"],
}


def _estimate_text_quality(text: str) -> float:
    """Estimate how clean the text is (0.0 = garbled, 1.0 = clean).
    Useful for detecting poor OCR output."""
    if not text or len(text) < 20:
        return 0.0
    
    total_chars = len(text)
    
    # Count alphabetic characters (A-Z, a-z)
    alpha_chars = sum(1 for c in text if c.isalpha())
    # Count known words (minimum 3 chars)
    words = text.split()
    known_words = sum(1 for w in words if len(w) >= 3 and sum(1 for c in w if c.isalpha()) > len(w) * 0.5)
    
    alpha_ratio = alpha_chars / max(total_chars, 1)
    word_quality = known_words / max(len(words), 1) if words else 0
    
    quality = (alpha_ratio * 0.5 + word_quality * 0.5)
    return min(max(quality, 0.0), 1.0)


def _check_signature_keywords(text: str) -> tuple:
    """Check for strong signature keywords that uniquely identify a document type.
    Returns (doc_type, confidence) if found, else (None, 0)."""
    text_lower = text.lower()
    for doc_type, keywords in TYPE_SIGNATURE_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                return doc_type, 0.92
    return None, 0


def _count_type_keywords(text: str) -> dict:
    """Count keyword matches for each document type."""
    text_lower = text.lower()
    scores = {}
    for doc_type, keywords in TYPE_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw.lower() in text_lower)
        if keywords:
            scores[doc_type] = matches / max(len(keywords), 1)
        else:
            scores[doc_type] = 0
    return scores


def classify_document(text: str) -> dict:
    """Classify document type using Ollama with improved accuracy"""
    
    text_sample = text[:5000] if text else ""
    
    # Step 1: Check text quality
    quality = _estimate_text_quality(text)
    logger.info(f"Text quality score: {quality:.2f}")
    
    # Step 2: Check signature keywords first (quick win)
    sig_type, sig_conf = _check_signature_keywords(text)
    if sig_type:
        logger.info(f"Signature keyword match: {sig_type} (confidence: {sig_conf})")
        return {
            "type": sig_type,
            "confidence": sig_conf,
            "reasoning": f"Matched signature keyword for '{sig_type}'"
        }
    
    # Step 3: Count keyword matches for fallback
    keyword_scores = _count_type_keywords(text)
    
    # Build document type descriptions for the prompt
    type_descriptions = {
        "invoice": "financial document with invoice numbers, line items, totals, tax, vendor/buyer info, payment terms",
        "contract": "legal agreement between parties with terms, conditions, signatures, legal clauses, dates",
        "certificate": "official document awarding or certifying completion/achievement/examination with recipient name, issuer, date, seal",
        "receipt": "proof of purchase with transaction details, payment method, store/vendor info",
        "resume": "job application document with work history, education, skills, personal summary",
        "letter": "formal/informal correspondence with salutation, body, closing signature",
        "report": "structured document with findings, analysis, sections, conclusions, recommendations",
        "memo": "internal business communication with TO/FROM/SUBJECT/DATE headers, brief",
        "proposal": "business proposal with scope, deliverables, timeline, budget, objectives",
        "email": "electronic mail message with FROM/TO/SUBJECT headers, conversational body",
        "form": "structured document with blank fields, questions, checkboxes, fillable sections",
    }
    
    type_guide = "\n".join([f"  - {t}: {type_descriptions.get(t, '')}" for t in DOCUMENT_TYPES if t != "other"])
    
    prompt = f"""You are a document classification expert. Analyze the document below and classify it into ONE of these types:

{type_guide}
  - other: any document that does not clearly fit the above categories

RULES:
- Look for keywords, formatting, structural clues, and document-specific terminology
- If the text quality appears poor (garbled OCR), focus on individual recognizable keywords
- If you see words like "CERTIFIED", "EXAMINATION", "BOARD OF", "SSC", "GRADE", "GPA" → certificate
- If you see invoice numbers, line items with prices, tax calculations, payment terms → invoice
- If you see agreement clauses, legal terms, parties, signatures → contract
- If you see proof of purchase with payment info → receipt
- Return ONLY a valid JSON object with "type" (string), "confidence" (float 0.0-1.0), and "reasoning" (string)

EXAMPLES:
- "INVOICE #123, Total Due: $500, Payment Terms: Net 30" → {{"type": "invoice", "confidence": 0.95, "reasoning": "Contains invoice number, total due, and payment terms"}}
- "This Agreement is made on, Party A and Party B agree to" → {{"type": "contract", "confidence": 0.95, "reasoning": "Contains agreement language and parties"}}
- "This certifies that, Certificate of Achievement, Awarded to" → {{"type": "certificate", "confidence": 0.95, "reasoning": "Contains certification language and award wording"}}
- "CERTIFIED THAT, SSC EXAMINATION, BOARD OF SECONDARY, GRADE/GPA" → {{"type": "certificate", "confidence": 0.95, "reasoning": "Contains exam certification keywords"}}

DOCUMENT TEXT:
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
                    "temperature": 0.1,
                    "num_predict": 150
                }
            },
            timeout=300.0
        )
        result = response.json()
        response_text = result.get("response", "").strip()
        
        logger.info(f"Classifier raw response: {response_text[:200]}")
        
        # Try to parse JSON from response
        doc_type, confidence, reasoning = _parse_classification(response_text)
        
        # Apply keyword-based adjustment
        confidence = _adjust_confidence(text, doc_type, confidence, keyword_scores)
        
        # If text quality is very poor, be more conservative
        if quality < 0.3 and doc_type != "other":
            confidence = min(confidence, 0.75)
        
        return {
            "type": doc_type,
            "confidence": confidence,
            "reasoning": reasoning
        }
        
    except Exception as e:
        logger.error(f"Classification error: {e}")
        return _keyword_fallback(text, keyword_scores)


def _parse_classification(response_text: str) -> tuple:
    """Parse classification JSON from LLM response with multiple fallback strategies"""
    
    # Strategy 1: Try to find and parse JSON in the response
    json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
    if json_match:
        try:
            parsed = json.loads(json_match.group())
            doc_type = parsed.get("type", "other").lower().strip()
            confidence = float(parsed.get("confidence", 0.5))
            reasoning = parsed.get("reasoning", "")
            if doc_type in DOCUMENT_TYPES:
                return doc_type, min(max(confidence, 0.0), 1.0), reasoning
        except (json.JSONDecodeError, ValueError, TypeError):
            pass
    
    # Strategy 2: Look for type name in response text
    for doc_type in DOCUMENT_TYPES:
        if doc_type != "other" and doc_type.lower() in response_text.lower():
            return doc_type, 0.75, f"Keyword match in LLM response"
    
    return "other", 0.4, "Could not determine document type"


def _adjust_confidence(text: str, doc_type: str, confidence: float, keyword_scores: dict = None) -> float:
    """Adjust confidence based on keyword evidence in the text"""
    
    if keyword_scores is None:
        keyword_scores = _count_type_keywords(text)
    
    if doc_type == "other":
        # Check if we have strong evidence for any type
        best_type = max(keyword_scores, key=keyword_scores.get)
        best_score = keyword_scores[best_type]
        
        if best_score >= 0.25:
            # There's evidence but model missed it
            return 0.65
        return min(confidence, 0.5)
    
    # Get keyword match ratio for the predicted type
    match_ratio = keyword_scores.get(doc_type, 0)
    
    if match_ratio >= 0.2:
        # Strong keyword support → boost confidence
        confidence = max(confidence, 0.7 + (match_ratio * 0.2))
    elif match_ratio >= 0.1:
        confidence = max(confidence, 0.65)
    else:
        # Few keywords found → lower confidence
        confidence = min(confidence, 0.6)
    
    return min(max(confidence, 0.0), 1.0)


def _keyword_fallback(text: str, keyword_scores: dict = None) -> dict:
    """Fallback classification using pure keyword matching"""
    logger.info("Using keyword fallback classification")
    
    if keyword_scores is None:
        keyword_scores = _count_type_keywords(text)
    
    # Check signature keywords first
    sig_type, sig_conf = _check_signature_keywords(text)
    if sig_type:
        return {
            "type": sig_type,
            "confidence": sig_conf,
            "reasoning": f"Signature keyword match: '{sig_type}'"
        }
    
    # Find best type by keyword score
    best_type = "other"
    best_score = 0
    
    for doc_type, score in keyword_scores.items():
        if score > best_score and score >= 0.08:
            best_score = score
            best_type = doc_type
    
    confidence = min(0.5 + (best_score * 0.4), 0.85) if best_type != "other" else 0.3
    
    return {
        "type": best_type,
        "confidence": confidence,
        "reasoning": f"Keyword-based classification: {best_type} (score: {best_score:.2f})"
    }
