# DocuIntell - Intelligent Document Processing System

A full-stack POC for intelligent document processing using AI (Ollama), Spring Boot, and Angular.

## Architecture

```
User → [Document Acquisition: File / Scan / Email]
     → [Intelligence: Preprocessing, Classification, Extraction, Summarization]
     → [Validation: Verify structured data]
          → YES → [Storage / Integration]
          → NO  → [Redirect to User for Review]
```

## Tech Stack

| Layer        | Technology                                  |
|--------------|---------------------------------------------|
| AI Service   | Python 3.11 + FastAPI + Ollama (llama3.1:8b)|
| Vector DB    | ChromaDB (local, persistent, CPU-friendly)  |
| Backend      | Java 17 + Spring Boot 3.2 + MySQL 8         |
| Frontend     | Angular 17 + Angular Material               |
| Auth         | JWT (jjwt 0.11.5)                           |

## Quick Start

### Option 1: Docker Compose (Recommended)

1. **Prerequisites:**
   - Docker and Docker Compose installed
   - Ollama installed with `llama3.1:8b` model

2. **Setup Ollama:**
   ```bash
   ollama pull llama3.1:8b
   ollama serve
   ```

3. **Run the application:**
   ```bash
   cd docuintell
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:8080
   - AI Service: http://localhost:8000

### Option 2: Manual Setup

#### 1. Python AI Service

```bash
cd docuintell/ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py
# Or: uvicorn main:app --host 0.0.0.0 --port 8000
```

#### 2. MySQL Database

```bash
# Using MySQL 8
mysql -u root -p < backend/src/main/resources/schema.sql
```

Or update `application.properties` with your database credentials.

#### 3. Spring Boot Backend

```bash
cd docuintell/backend

# Build and run
mvn clean install
mvn spring-boot:run
```

#### 4. Angular Frontend

```bash
cd docuintell/frontend

# Install Angular CLI if needed
npm install -g @angular/cli

# Install dependencies
npm install

# Run development server
npm start
```

Access at http://localhost:4200

## API Endpoints

### Documents
- `POST /api/documents/upload` - Upload and process document
- `GET /api/documents` - List all documents (paginated)
- `GET /api/documents/{uuid}` - Get document by UUID
- `DELETE /api/documents/{uuid}` - Delete document
- `GET /api/documents/stats` - Get dashboard statistics

### Validation
- `POST /api/validation/{uuid}/approve` - Approve document
- `POST /api/validation/{uuid}/reject` - Reject document
- `GET /api/validation/{uuid}/history` - Get validation history

### Search
- `POST /api/search/semantic` - Semantic search

### Health
- `GET /api/health` - Health check

## Configuration

### AI Service (.env)
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
CHROMA_PERSIST_DIRECTORY=./chroma_data
```

### Backend (application.properties)
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/docuintell_db
spring.datasource.username=root
spring.datasource.password=root
app.ai.service.url=http://localhost:8000
```

## Project Structure

```
docuintell/
├── ai-service/           # Python FastAPI
│   ├── main.py
│   ├── config.py
│   ├── models/
│   └── services/
│       ├── preprocessor.py
│       ├── classifier.py
│       ├── extractor.py
│       ├── summarizer.py
│       ├── vector_store.py
│       └── document_service.py
│
├── backend/              # Spring Boot
│   ├── pom.xml
│   └── src/main/java/com/docuintell/
│       ├── entity/
│       ├── dto/
│       ├── repository/
│       ├── service/
│       └── controller/
│
├── frontend/             # Angular 17
│   └── src/app/
│       ├── core/
│       │   ├── models/
│       │   ├── services/
│       │   └── interceptors/
│       └── features/
│           ├── dashboard/
│           ├── upload/
│           ├── documents/
│           ├── document-detail/
│           ├── review/
│           └── semantic-search/
│
├── docker-compose.yml
└── README.md
```

## POC Pipeline Flow

1. User opens Angular app → Dashboard shows stats
2. User goes to Upload → selects file → clicks Upload
3. Angular POST /api/documents/upload (multipart)
4. Spring Boot saves file → creates Document(PENDING) → calls Python AI
5. Python AI processes document:
   - Preprocessor extracts text
   - Classifier calls Ollama → gets document type
   - Extractor calls Ollama → gets structured JSON
   - Summarizer calls Ollama → gets summary
   - VectorStore stores in ChromaDB
6. Spring Boot updates Document with AI results → status=AI_PROCESSED
7. ValidationService runs automatic rules:
   - PASS → status=VALIDATED → IntegrationService logs it → status=INTEGRATED
   - FAIL → status=NEEDS_REVIEW
8. Angular shows result

## License

MIT License# Doc-Intelligent
