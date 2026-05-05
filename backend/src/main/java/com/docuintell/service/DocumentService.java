package com.docuintell.service;

import com.docuintell.entity.Document;
import com.docuintell.repository.DocumentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DocumentService {
    
    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);
    
    private final DocumentRepository documentRepository;
    private final AIClientService aiClientService;
    private final ObjectMapper objectMapper;
    
    @Value("${ai.service.url}")
    private String aiServiceUrl;
    
    @Autowired
    public DocumentService(DocumentRepository documentRepository, AIClientService aiClientService) {
        this.documentRepository = documentRepository;
        this.aiClientService = aiClientService;
        this.objectMapper = new ObjectMapper();
    }
    
    public Document processDocument(MultipartFile file) throws Exception {
        logger.info("Processing document: {}", file.getOriginalFilename());
        
        // Create document record
        String documentId = UUID.randomUUID().toString();
        Document document = new Document(documentId, file.getOriginalFilename(), file.getContentType());
        document.setFileSize(file.getSize());
        document.setStatus("processing");
        
        // Save initial record
        document = documentRepository.save(document);
        
        try {
            // Send to AI service
            ProcessingResponse response = aiClientService.processDocument(file);
            
            // Update document with results
            document.setDocumentType(response.getClassification().getDocumentType());
            document.setConfidence(response.getClassification().getConfidence());
            document.setExtractedText(response.getExtraction().getRawText());
            document.setSummary(response.getExtraction().getSummary());
            document.setValidationScore(response.getValidation().getScore());
            document.setIsValid(response.getValidation().getIsValid());
            document.setValidationIssues(String.join("; ", response.getValidation().getIssues()));
            document.setStatus(response.getStatus());
            document.setUpdatedAt(LocalDateTime.now());
            
        } catch (Exception e) {
            logger.error("AI processing failed: {}", e.getMessage());
            document.setStatus("failed");
            document.setValidationIssues("AI processing failed: " + e.getMessage());
            document.setUpdatedAt(LocalDateTime.now());
        }
        
        return documentRepository.save(document);
    }
    
    public Optional<Document> getDocument(String id) {
        return documentRepository.findById(id);
    }
    
    public List<Document> getAllDocuments() {
        return documentRepository.findAllOrderByCreatedAtDesc();
    }
    
    public List<Document> getDocumentsByStatus(String status) {
        return documentRepository.findByStatus(status);
    }
    
    public List<Document> getDocumentsNeedingReview() {
        return documentRepository.findDocumentsNeedingReview();
    }
    
    public Document updateDocumentStatus(String id, String status) throws Exception {
        Optional<Document> docOpt = documentRepository.findById(id);
        if (!docOpt.isPresent()) {
            throw new Exception("Document not found");
        }
        
        Document document = docOpt.get();
        document.setStatus(status);
        document.setUpdatedAt(LocalDateTime.now());
        
        return documentRepository.save(document);
    }
    
    public Document submitForReview(String id, String reviewedData) throws Exception {
        Optional<Document> docOpt = documentRepository.findById(id);
        if (!docOpt.isPresent()) {
            throw new Exception("Document not found");
        }
        
        Document document = docOpt.get();
        
        // Parse reviewed data
        try {
            document.setDocumentType(reviewedData);
            document.setStatus("reviewed");
            document.setUpdatedAt(LocalDateTime.now());
        } catch (Exception e) {
            throw new Exception("Invalid review data");
        }
        
        return documentRepository.save(document);
    }
    
    public void deleteDocument(String id) {
        documentRepository.deleteById(id);
    }
    
    public Long countByStatus(String status) {
        return documentRepository.countByStatus(status);
    }
    
    // Inner class for AI response parsing
    public static class ProcessingResponse {
        private Classification classification;
        private Extraction extraction;
        private Validation validation;
        private String status;
        
        public Classification getClassification() {
            return classification;
        }
        
        public void setClassification(Classification classification) {
            this.classification = classification;
        }
        
        public Extraction getExtraction() {
            return extraction;
        }
        
        public void setExtraction(Extraction extraction) {
            this.extraction = extraction;
        }
        
        public Validation getValidation() {
            return validation;
        }
        
        public void setValidation(Validation validation) {
            this.validation = validation;
        }
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
    }
    
    public static class Classification {
        private String documentType;
        private Double confidence;
        private String reasoning;
        
        public String getDocumentType() {
            return documentType;
        }
        
        public void setDocumentType(String documentType) {
            this.documentType = documentType;
        }
        
        public Double getConfidence() {
            return confidence;
        }
        
        public void setConfidence(Double confidence) {
            this.confidence = confidence;
        }
        
        public String getReasoning() {
            return reasoning;
        }
        
        public void setReasoning(String reasoning) {
            this.reasoning = reasoning;
        }
    }
    
    public static class Extraction {
        private List<Field> fields;
        private String rawText;
        private String summary;
        
        public List<Field> getFields() {
            return fields;
        }
        
        public void setFields(List<Field> fields) {
            this.fields = fields;
        }
        
        public String getRawText() {
            return rawText;
        }
        
        public void setRawText(String rawText) {
            this.rawText = rawText;
        }
        
        public String getSummary() {
            return summary;
        }
        
        public void setSummary(String summary) {
            this.summary = summary;
        }
    }
    
    public static class Field {
        private String name;
        private String value;
        private Double confidence;
        private String fieldType;
        
        public String getName() {
            return name;
        }
        
        public void setName(String name) {
            this.name = name;
        }
        
        public String getValue() {
            return value;
        }
        
        public void setValue(String value) {
            this.value = value;
        }
        
        public Double getConfidence() {
            return confidence;
        }
        
        public void setConfidence(Double confidence) {
            this.confidence = confidence;
        }
        
        public String getFieldType() {
            return fieldType;
        }
        
        public void setFieldType(String fieldType) {
            this.fieldType = fieldType;
        }
    }
    
    public static class Validation {
        private Boolean isValid;
        private Double score;
        private List<String> issues;
        private List<String> recommendations;
        
        public Boolean getIsValid() {
            return isValid;
        }
        
        public void setIsValid(Boolean isValid) {
            this.isValid = isValid;
        }
        
        public Double getScore() {
            return score;
        }
        
        public void setScore(Double score) {
            this.score = score;
        }
        
        public List<String> getIssues() {
            return issues;
        }
        
        public void setIssues(List<String> issues) {
            this.issues = issues;
        }
        
        public List<String> getRecommendations() {
            return recommendations;
        }
        
        public void setRecommendations(List<String> recommendations) {
            this.recommendations = recommendations;
        }
    }
}