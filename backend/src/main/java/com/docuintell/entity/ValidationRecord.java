package com.docuintell.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "validation_records")
public class ValidationRecord {
    
    @Id
    @Column(name = "id", length = 36)
    private String id;
    
    @Column(name = "document_id", length = 36)
    private String documentId;
    
    @Column(name = "score")
    private Double score;
    
    @Column(name = "is_valid")
    private Boolean isValid;
    
    @Column(name = "issues", columnDefinition = "TEXT")
    private String issues;
    
    @Column(name = "recommendations", columnDefinition = "TEXT")
    private String recommendations;
    
    @Column(name = "validated_at")
    private LocalDateTime validatedAt;
    
    // Constructors
    public ValidationRecord() {
    }
    
    public ValidationRecord(String documentId) {
        this.id = java.util.UUID.randomUUID().toString();
        this.documentId = documentId;
        this.validatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getDocumentId() {
        return documentId;
    }
    
    public void setDocumentId(String documentId) {
        this.documentId = documentId;
    }
    
    public Double getScore() {
        return score;
    }
    
    public void setScore(Double score) {
        this.score = score;
    }
    
    public Boolean getIsValid() {
        return isValid;
    }
    
    public void setIsValid(Boolean isValid) {
        this.isValid = isValid;
    }
    
    public String getIssues() {
        return issues;
    }
    
    public void setIssues(String issues) {
        this.issues = issues;
    }
    
    public String getRecommendations() {
        return recommendations;
    }
    
    public void setRecommendations(String recommendations) {
        this.recommendations = recommendations;
    }
    
    public LocalDateTime getValidatedAt() {
        return validatedAt;
    }
    
    public void setValidatedAt(LocalDateTime validatedAt) {
        this.validatedAt = validatedAt;
    }
}