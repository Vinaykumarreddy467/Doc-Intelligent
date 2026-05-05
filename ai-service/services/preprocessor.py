"""Document Preprocessing Service"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Optional OCR support
try:
    import pytesseract
    from PIL import Image
    HAS_OCR = True
except ImportError:
    HAS_OCR = False
    logger.warning("pytesseract not installed, OCR disabled")

def extract_text_from_file(file_path: str) -> str:
    """Extract text from a file based on its extension"""
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".txt":
        return _read_text(file_path)
    elif ext == ".pdf":
        return _read_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return _read_docx(file_path)
    elif ext == ".csv":
        return _read_csv(file_path)
    elif ext in [".jpg", ".jpeg", ".png", ".tiff", ".bmp"]:
        return _read_image(file_path)
    else:
        return _read_text(file_path)

def _read_text(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def _read_pdf(file_path: str) -> str:
    try:
        import PyPDF2
        text = ""
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""
        return text
    except ImportError:
        logger.error("PyPDF2 not installed")
        return ""

def _read_docx(file_path: str) -> str:
    try:
        import docx2txt
        return docx2txt.process(file_path)
    except ImportError:
        logger.error("docx2txt not installed")
        return ""

def _read_csv(file_path: str) -> str:
    import csv
    text = ""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        for row in reader:
            text += " ".join(row) + "\n"
    return text

def _read_image(file_path: str) -> str:
    if not HAS_OCR:
        return ""
    img = Image.open(file_path)
    return pytesseract.image_to_string(img)
