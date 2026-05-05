package com.docuintell.service;

import com.docuintell.entity.Document;
import com.docuintell.entity.ValidationRecord;
import com.docuintell.repository.ValidationRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ValidationService {
    
    private static final Logger logger = LoggerFactory.getLogger(ValidationService.class);
    
    private final ValidationRecordRepository validationRecordRepository;
    
    @Autowired
    public ValidationService(ValidationRecordRepository validationRecordRepository) {
        this.validationRecordRepository = validationRecordRepository;
    }
    
    public ValidationRecord validateDocument(Document document) {
        logger.info("Validating document: {}", document.getId());
        
        ValidationRecord record = new ValidationRecord(document.getId());
        
        // Calculate validation score based on document data
        double score = calculateValidationScore(document);
        record.setScore(score);
        
        // Determine if valid
        boolean isValid = score >= 0.5;
        record.setIsValid(isValid);
        
        // Generate issues and recommendations
        List<String> issues = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();
        
        if (document.getDocumentType() == null || document.getDocumentType().isEmpty()) {
            issues.add("No document type classified");
            recommendations.add("Re-classify the document");
        }
        
        if (document.getConfidence() == null || document.getConfidence() < 0.6) {
            issues.add("Low classification confidence");
            recommendations.add("Verify the document type manually");
        }
        
        if (document.getExtractedText() == null || document.getExtractedText().isEmpty()) {
            issues.add("No text extracted");
            recommendations.add("Check document quality");
        }
        
        record.setIssues(String.join("; ", issues));
        record.setRecommendations(String.join("; ", recommendations));
        
        return validationRecordRepository.save(record);
    }
    
    private double calculateValidationScore(Document document) {
        double score = 0.0;
        
        // Document type presence (40%)
        if (document.getDocumentType() != null && !document.getDocumentType().isEmpty()) {
            score += 0.4;
        }
        
        // Confidence score (30%)
        if (document.getConfidence() != null) {
            score += document.getConfidence() * 0.3;
        }
        
        // Text extraction (30%)
        if (document.getExtractedText() != null && document.getExtractedText().length() > 50) {
            score += 0.3;
        }
        
        return Math.min(1.0, score);
    }
    
    public Optional<ValidationRecord> getValidationRecord(String documentId) {
        return validationRecordRepository.findByDocumentId(documentId);
    }
    
    public List<ValidationRecord> getAllValidationRecords() {
        return validationRecordRepository.findAll();
    }
}