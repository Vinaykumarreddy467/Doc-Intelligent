# DocuIntell - Intelligent Document Processing System

A full-stack POC for intelligent document processing using AI (Ollama), Spring Boot, and a lightweight frontend.

## Architecture

```
User → [Upload Document: PDF / DOCX / TXT / CSV / Images]
     → [Text Extraction: PyPDF2 / docx2txt / raw reader]
     → [AI Processing via Ollama: Classification → Extraction → Summarization]
     → [Verification Modal: Review & Edit AI results]
          → Save → [Database: H2 in-memory]
```

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| AI Service   | Python 3.14 + FastAPI + Ollama      |
| Backend      | Java 17 + Spring Boot 3.2 + H2      |
| Frontend     | Static HTML + Vanilla JS            |
| LLM          | Ollama (phi3, mistral, llama3.1, etc.) |

## System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **OS** | Linux (Ubuntu 22.04+), macOS, Windows 10+ |
| **CPU** | 4 cores (8+ recommended for LLM inference) |
| **RAM** | 8 GB minimum (16 GB recommended) |
| **Disk** | 20 GB free space |
| **Python** | 3.10 or higher |
| **Java** | 17 or higher (JDK) |
| **Maven** | 3.8+ |

### Model-Specific RAM Requirements

| Model | RAM Needed | Disk Space |
|-------|-----------|------------|
| `tinyllama` | 2 GB | 637 MB |
| `phi3` | 4 GB | 2.2 GB |
| `llama3.2:3b` | 4 GB | 2.0 GB |
| `mistral:7b` | 8 GB | 4.4 GB |
| `llama3.1:8b` | 10 GB | 4.9 GB |

> **Note:** Ollama loads the model into RAM. Ensure you have enough free RAM for both the model and the rest of the system.

### OCR Support (Optional)

For image/PDF-with-images text extraction, install the system OCR engine:

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

**Windows:**
Download from [tesseract-ocr GitHub](https://github.com/tesseract-ocr/tesseract) and add to PATH.

Python dependencies (`Pillow`, `pytesseract`) are included in `requirements.txt` and install automatically.

## Quick Start

### Prerequisites

1. **Ollama** installed and running:
   ```bash
   ollama serve
   ```

2. **Pull a model** (phi3 recommended for CPU):
   ```bash
   ollama pull phi3
   # Or: ollama pull mistral:7b
   # Or: ollama pull llama3.1:8b
   # Or: ollama pull tinyllama
   ```

### Start All Services

```bash
cd docuintell

# 1. AI Service (Python)
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &

# 2. Backend (Spring Boot)
cd ../backend
mvn spring-boot:run &

# 3. Frontend
cd ../frontend
python3 -m http.server 8081 &
```

### Access the Application

| Service    | URL                      |
|------------|--------------------------|
| Frontend   | http://localhost:8081    |
| Backend    | http://localhost:8082    |
| AI Service | http://localhost:8000    |
| Ollama     | http://localhost:11434   |

> **Note:** Backend runs on port **8082** because port 8080 may be used by other services (e.g., OpenGrok).

## Configuration

### Change the LLM Model

Edit `ai-service/config.py`:

```python
class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "phi3"        # <-- Change this
    upload_dir: str = "./uploads"
```

**Available models** (pull with `ollama pull <model>`):

| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| `tinyllama` | 637 MB | Fastest (~17s) | Lower |
| `phi3` | 2.2 GB | Fast (~29s) | Good |
| `llama3.2:3b` | 2.0 GB | Medium | Good |
| `mistral:7b` | 4.4 GB | Slow (~109s) | Better |
| `llama3.1:8b` | 4.9 GB | Slowest (~120s) | Best |

After changing the model, restart the AI service:

```bash
pkill -f uvicorn
cd ai-service && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 &
```

### Change AI Processing Timeouts

Each AI step (classify, extract, summarize) has its own timeout. Edit these files:

**1. Classifier timeout** — `ai-service/services/classifier.py`:
```python
response = httpx.post(
    f"{settings.ollama_base_url}/api/generate",
    json={...},
    timeout=300.0    # <-- Change this (seconds)
)
```

**2. Extractor timeout** — `ai-service/services/extractor.py`:
```python
response = httpx.post(
    f"{settings.ollama_base_url}/api/generate",
    json={...},
    timeout=300.0    # <-- Change this (seconds)
)
```

**3. Summarizer timeout** — `ai-service/services/summarizer.py`:
```python
response = httpx.post(
    f"{settings.ollama_base_url}/api/generate",
    json={...},
    timeout=300.0    # <-- Change this (seconds)
)
```

**4. Backend timeout** — `backend/src/main/resources/application.properties`:
```properties
# AI Service
ai.service.url=http://localhost:8000
ai.service.timeout=600000          # <-- Change this (milliseconds)

# Server timeouts
server.servlet.connection-timeout=600000   # <-- Change this
spring.mvc.async.request-timeout=600000    # <-- Change this
```

> **Rule of thumb:** Set each AI step timeout to at least **2x** the model's average response time. The backend timeout should be **3x** the total of all 3 AI steps combined.

### Example: Fast Processing with tinyllama

```python
# ai-service/config.py
ollama_model: str = "tinyllama"

# ai-service/services/classifier.py, extractor.py, summarizer.py
timeout=60.0    # 60 seconds per step

# backend/src/main/resources/application.properties
ai.service.timeout=180000           # 3 minutes total
server.servlet.connection-timeout=180000
spring.mvc.async.request-timeout=180000
```

### Example: High Quality with mistral:7b

```python
# ai-service/config.py
ollama_model: str = "mistral:7b"

# ai-service/services/classifier.py, extractor.py, summarizer.py
timeout=300.0    # 5 minutes per step

# backend/src/main/resources/application.properties
ai.service.timeout=900000           # 15 minutes total
server.servlet.connection-timeout=900000
spring.mvc.async.request-timeout=900000
```

## API Endpoints

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload and process document |
| GET | `/api/documents` | List all documents |
| GET | `/api/documents/{id}` | Get document by ID |
| PUT | `/api/documents/{id}/verify` | Save verification edits |
| DELETE | `/api/documents/{id}` | Delete document |
| GET | `/api/documents/stats` | Dashboard statistics |

### AI Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | AI service health check |
| POST | `/process` | Process uploaded file |
| POST | `/search` | Search indexed documents |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Full system health check |

## Processing Pipeline

1. **Upload** → User uploads file via frontend
2. **Text Extraction** → Instant (PyPDF2 for PDF, docx2txt for DOCX, pytesseract for images, raw reader for TXT/CSV)
3. **Classification** → Ollama identifies document type (invoice, contract, resume, etc.)
4. **Field Extraction** → Ollama extracts structured fields from the document
5. **Summarization** → Ollama generates a 2-3 sentence summary
6. **Verification Modal** → User reviews all AI results, can edit any field
7. **Save** → Edits persisted to database, status set to "processed"

## Project Structure

```
docuintell/
├── ai-service/
│   ├── config.py                 # Model & timeout settings
│   ├── main.py                   # FastAPI endpoints
│   ├── requirements.txt          # Python dependencies
│   └── services/
│       ├── preprocessor.py       # Text extraction (PDF, DOCX, TXT, CSV)
│       ├── classifier.py         # Document type classification
│       ├── extractor.py          # Field extraction
│       ├── summarizer.py         # Document summarization
│       ├── vector_store.py       # Keyword search index
│       ├── email_reader.py       # IMAP email fetching
│       └── document_service.py   # Pipeline orchestrator
│
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/docuintell/
│       ├── entity/               # JPA entities
│       ├── dto/                  # Response DTOs
│       ├── repository/           # Spring Data repositories
│       ├── service/              # Business logic
│       └── controller/           # REST endpoints
│
├── frontend/
│   └── index.html                # Single-page app (HTML + JS)
│
├── start.sh                      # Start all services
├── stop.sh                       # Stop all services
└── README.md
```

## Supported File Types

| Type | Extensions | Extractor | Status |
|------|-----------|-----------|--------|
| Plain Text | `.txt`, `.md` | Built-in | ✅ Always |
| PDF | `.pdf` | PyPDF2 | ✅ Always |
| Word | `.docx`, `.doc` | docx2txt | ✅ Always |
| CSV | `.csv` | Built-in csv module | ✅ Always |
| Images | `.jpg`, `.png`, `.tiff`, `.bmp` | pytesseract + Pillow | ✅ Requires `tesseract-ocr` system package |
| PDF with Images | `.pdf` (scanned) | PyPDF2 + pytesseract | ✅ Requires `tesseract-ocr` system package |

## License

MIT License
