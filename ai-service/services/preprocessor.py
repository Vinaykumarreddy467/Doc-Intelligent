"""Document Preprocessing Service"""
import os
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Optional OCR support
try:
    import pytesseract
    from PIL import Image, ImageEnhance, ImageFilter
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
        return _clean_text(text)
    except ImportError:
        logger.error("PyPDF2 not installed")
        return ""


def _read_docx(file_path: str) -> str:
    try:
        import docx2txt
        text = docx2txt.process(file_path)
        return _clean_text(text)
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
    return _clean_text(text)


def _read_image(file_path: str) -> str:
    if not HAS_OCR:
        return ""
    
    try:
        img = Image.open(file_path)
        
        # Convert RGBA to RGB (common in scanned PNGs)
        if img.mode == 'RGBA':
            rgb = Image.new('RGB', img.size, (255, 255, 255))
            rgb.paste(img, mask=img.split()[3])
            img = rgb
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Strategy 1: Resize 2x for small images + grayscale
        if img.width < 600 or img.height < 600:
            img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)
        
        gray = img.convert('L')
        
        # Try multiple OCR configs and pick the one with most text
        results = []
        
        # Config A: Standard grayscale
        text_a = pytesseract.image_to_string(gray, lang='eng', config='--psm 6 --oem 3')
        results.append((text_a, len(text_a)))
        
        # Config B: High contrast
        enhancer = ImageEnhance.Contrast(gray)
        high_contrast = enhancer.enhance(2.0)
        text_b = pytesseract.image_to_string(high_contrast, lang='eng', config='--psm 6 --oem 3')
        results.append((text_b, len(text_b)))
        
        # Pick the result with the most extracted text (usually better)
        results.sort(key=lambda x: x[1], reverse=True)
        best_text = results[0][0]
        
        if not best_text.strip():
            # Final fallback: try with original image
            img_orig = Image.open(file_path)
            best_text = pytesseract.image_to_string(img_orig, lang='eng')
        
        return _clean_ocr_text(best_text)
        
    except Exception as e:
        logger.error(f"OCR error: {e}")
        return ""


def _clean_text(text: str) -> str:
    """Clean up extracted text"""
    if not text:
        return ""
    # Remove excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    return text.strip()


def _clean_ocr_text(text: str) -> str:
    """Clean up OCR output which often has noise"""
    if not text:
        return ""
    
    # Remove lines that are mostly non-alphanumeric (garbage)
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        # Count alphanumeric characters
        alpha_num = sum(1 for c in line if c.isalnum() or c.isspace())
        if len(line) > 0:
            ratio = alpha_num / len(line)
            # Keep line if it has enough real characters
            if ratio > 0.3 and len(line.strip()) > 1:
                cleaned_lines.append(line.strip())
    
    text = '\n'.join(cleaned_lines)
    
    # Remove repeated garbage characters
    text = re.sub(r'([^a-zA-Z0-9\s\.\,\:\;\-\(\)\/\#\$\%\@])\1{3,}', '', text)
    
    # Normalize whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()
