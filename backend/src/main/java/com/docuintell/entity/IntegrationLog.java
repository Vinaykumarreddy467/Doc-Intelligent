package com.docuintell.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "integration_logs")
public class IntegrationLog {
    
    @Id
    @Column(name = "id", length = 36)
    private String id;
    
    @Column(name = "document_id", length = 36)
    private String documentId;
    
    @Column(name = "target_system", length = 50)
    private String targetSystem;
    
    @Column(name = "status", length = 20)
    private String status;
    
    @Column(name = "request_data", columnDefinition = "TEXT")
    private String requestData;
    
    @Column(name = "response_data", columnDefinition = "TEXT")
    private String responseData;
    
    @Column(name = "error_message")
    private String errorMessage;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // Constructors
    public IntegrationLog() {
    }
    
    public IntegrationLog(String documentId, String targetSystem) {
        this.id = java.util.UUID.randomUUID().toString();
        this.documentId = documentId;
        this.targetSystem = targetSystem;
        this.status = "pending";
        this.createdAt = LocalDateTime.now();
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
    
    public String getTargetSystem() {
        return targetSystem;
    }
    
    public void setTargetSystem(String targetSystem) {
        this.targetSystem = targetSystem;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getRequestData() {
        return requestData;
    }
    
    public void setRequestData(String requestData) {
        this.requestData = requestData;
    }
    
    public String getResponseData() {
        return responseData;
    }
    
    public void setResponseData(String responseData) {
        this.responseData = responseData;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}