"""Document Processing Orchestrator"""
import os
import logging
from services.preprocessor import extract_text_from_file
from services.classifier import classify_document
from services.extractor import extract_fields
from services.summarizer import summarize_document
from services.vector_store import search_service

logger = logging.getLogger(__name__)

class DocumentService:
    def process_file(self, file_path: str, document_id: str) -> dict:
        """Process a document through the full pipeline"""
        logger.info(f"Processing document: {document_id}")
        
        # Step 1: Extract text
        text = extract_text_from_file(file_path)
        if not text:
            return {
                "status": "failed",
                "classification": {
                    "documentType": "unknown",
                    "confidence": 0.0,
                    "reasoning": "No text extracted"
                },
                "extraction": {
                    "fields": [],
                    "rawText": "",
                    "summary": ""
                },
                "validation": {
                    "isValid": False,
                    "score": 0.0,
                    "issues": ["No text extracted from document"],
                    "recommendations": []
                }
            }
        
        # Step 2: Classify
        classification = classify_document(text)
        doc_type = classification.get("type", "other")
        confidence = classification.get("confidence", 0.0)
        
        # Step 3: Extract fields
        fields = extract_fields(text, doc_type)
        
        # Step 4: Summarize
        summary = summarize_document(text)
        
        # Step 5: Index for search
        search_service.add_document(document_id, os.path.basename(file_path), text, doc_type)
        
        return {
            "status": "completed",
            "classification": {
                "documentType": doc_type,
                "confidence": confidence,
                "reasoning": f"Classified as {doc_type} with confidence {confidence}"
            },
            "extraction": {
                "fields": [{"name": k, "value": str(v), "confidence": 0.8, "fieldType": "text"} for k, v in fields.items()],
                "rawText": text[:5000],
                "summary": summary
            },
            "validation": {
                "isValid": True,
                "score": confidence,
                "issues": [],
                "recommendations": ["Review extracted fields for accuracy"]
            }
        }
    
    def search_documents(self, query: str, limit: int = 5) -> list:
        """Search indexed documents"""
        return search_service.search(query, limit)

document_service = DocumentService()
