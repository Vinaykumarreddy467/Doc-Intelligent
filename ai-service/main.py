"""DocuIntell AI Service"""
import os
import uuid
import shutil
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from config import settings
from services.document_service import document_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DocuIntell AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str
    limit: int = 5

class EmailRequest(BaseModel):
    host: str
    port: int = 993
    username: str
    password: str
    limit: int = 10

@app.get("/")
def root():
    return {"service": "DocuIntell AI", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok", "model": settings.ollama_model}

@app.post("/process")
async def process_file(
    file: UploadFile = File(...),
    document_id: str = Form(...)
):
    """Process uploaded file"""
    if not document_id:
        document_id = str(uuid.uuid4())
    
    # Save file
    ext = os.path.splitext(file.filename)[1] if file.filename else ".txt"
    save_path = os.path.join(settings.upload_dir, f"{document_id}{ext}")
    
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    try:
        result = document_service.process_file(save_path, document_id)
        return result
    except Exception as e:
        logger.error(f"Processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_documents(request: SearchRequest):
    """Search indexed documents"""
    results = document_service.search_documents(request.query, request.limit)
    return {"results": results}

@app.post("/scan")
async def scan_directory(directory: str = Form(...)):
    """Scan a directory for documents"""
    if not os.path.exists(directory):
        raise HTTPException(status_code=404, detail="Directory not found")
    
    processed = []
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        if os.path.isfile(filepath):
            doc_id = str(uuid.uuid4())
            try:
                result = document_service.process_file(filepath, doc_id)
                processed.append(result)
            except Exception as e:
                logger.error(f"Error processing {filename}: {e}")
    
    return {"processed": len(processed), "results": processed}

@app.post("/email")
async def process_email(request: EmailRequest):
    """Fetch and process emails"""
    from services.email_reader import fetch_emails
    
    emails = fetch_emails(
        request.host, request.port,
        request.username, request.password,
        request.limit
    )
    
    processed = []
    for email_data in emails:
        doc_id = str(uuid.uuid4())
        try:
            result = document_service.process_file(
                _save_email_as_file(email_data), doc_id
            )
            processed.append(result)
        except Exception as e:
            logger.error(f"Error processing email: {e}")
    
    return {"processed": len(processed), "results": processed}

def _save_email_as_file(email_data: dict) -> str:
    doc_id = str(uuid.uuid4())
    filepath = os.path.join(settings.upload_dir, f"{doc_id}.txt")
    with open(filepath, "w") as f:
        f.write(f"Subject: {email_data['subject']}\n")
        f.write(f"From: {email_data['from']}\n")
        f.write(f"Date: {email_data['date']}\n\n")
        f.write(email_data['body'])
    return filepath
