"""Simple Document Search Service"""
import os
import json
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

SEARCH_INDEX_FILE = "./search_index.json"

class SearchService:
    def __init__(self):
        self.index = self._load_index()
    
    def _load_index(self) -> List[Dict]:
        if os.path.exists(SEARCH_INDEX_FILE):
            with open(SEARCH_INDEX_FILE, "r") as f:
                return json.load(f)
        return []
    
    def _save_index(self):
        with open(SEARCH_INDEX_FILE, "w") as f:
            json.dump(self.index, f)
    
    def add_document(self, doc_id: str, filename: str, text: str, doc_type: str):
        entry = {
            "id": doc_id,
            "filename": filename,
            "text": text[:2000],
            "type": doc_type
        }
        self.index.append(entry)
        self._save_index()
    
    def search(self, query: str, limit: int = 5) -> List[Dict]:
        """Simple keyword search"""
        query_words = set(query.lower().split())
        results = []
        
        for doc in self.index:
            text = doc.get("text", "").lower()
            score = 0
            for word in query_words:
                if word in text:
                    score += text.count(word)
            if score > 0:
                results.append({
                    "id": doc["id"],
                    "filename": doc["filename"],
                    "type": doc["type"],
                    "score": score
                })
        
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]

search_service = SearchService()
