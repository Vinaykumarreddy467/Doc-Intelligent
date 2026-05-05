package com.docuintell.controller;

import com.docuintell.dto.ApiResponse;
import com.docuintell.dto.DocumentResponseDTO;
import com.docuintell.entity.Document;
import com.docuintell.service.DocumentService;
import com.docuintell.service.ValidationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    
    private static final Logger logger = LoggerFactory.getLogger(DocumentController.class);
    
    private final DocumentService documentService;
    private final ValidationService validationService;
    
    @Autowired
    public DocumentController(DocumentService documentService, ValidationService validationService) {
        this.documentService = documentService;
        this.validationService = validationService;
    }
    
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<DocumentResponseDTO>> uploadDocument(
            @RequestParam("file") MultipartFile file) {
        try {
            logger.info("Received upload request: {}", file.getOriginalFilename());
            
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("File is empty"));
            }
            
            Document document = documentService.processDocument(file);
            DocumentResponseDTO dto = toDTO(document);
            
            return ResponseEntity.ok(ApiResponse.success("Document processed", dto));
            
        } catch (Exception e) {
            logger.error("Upload error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Processing failed", e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentResponseDTO>>> getAllDocuments() {
        List<Document> documents = documentService.getAllDocuments();
        List<DocumentResponseDTO> dtos = documents.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponseDTO>> getDocument(@PathVariable String id) {
        return documentService.getDocument(id)
                .map(doc -> ResponseEntity.ok(ApiResponse.success(toDTO(doc))))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<DocumentResponseDTO>>> getDocumentsByStatus(
            @PathVariable String status) {
        List<Document> documents = documentService.getDocumentsByStatus(status);
        List<DocumentResponseDTO> dtos = documents.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }
    
    @GetMapping("/review")
    public ResponseEntity<ApiResponse<List<DocumentResponseDTO>>> getDocumentsNeedingReview() {
        List<Document> documents = documentService.getDocumentsNeedingReview();
        List<DocumentResponseDTO> dtos = documents.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<DocumentResponseDTO>> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            Document document = documentService.updateDocumentStatus(id, status);
            return ResponseEntity.ok(ApiResponse.success("Status updated", toDTO(document)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/review")
    public ResponseEntity<ApiResponse<DocumentResponseDTO>> submitReview(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String reviewedData = request.get("documentType");
            Document document = documentService.submitForReview(id, reviewedData);
            return ResponseEntity.ok(ApiResponse.success("Review submitted", toDTO(document)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<DocumentResponseDTO>> verifyDocument(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            Document document = documentService.getDocument(id)
                    .orElseThrow(() -> new Exception("Document not found"));
            
            String extractedText = request.get("extractedText");
            String summary = request.get("summary");
            String documentType = request.get("documentType");
            
            if (extractedText != null) {
                document.setExtractedText(extractedText);
            }
            if (summary != null) {
                document.setSummary(summary);
            }
            if (documentType != null) {
                document.setDocumentType(documentType);
            }
            
            document.setStatus("processed");
            document.setIsValid(true);
            document.setUpdatedAt(java.time.LocalDateTime.now());
            
            documentService.saveDocument(document);
            return ResponseEntity.ok(ApiResponse.success("Document verified", toDTO(document)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable String id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.success("Document deleted", null));
    }
    
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStats() {
        Map<String, Long> stats = new HashMap<>();
        
        stats.put("total", documentService.countByStatus("processed") + 
                         documentService.countByStatus("needs_review") + 
                         documentService.countByStatus("failed"));
        stats.put("processed", documentService.countByStatus("processed"));
        stats.put("needs_review", documentService.countByStatus("needs_review"));
        stats.put("failed", documentService.countByStatus("failed"));
        
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
    
    private DocumentResponseDTO toDTO(Document document) {
        DocumentResponseDTO dto = new DocumentResponseDTO();
        dto.setId(document.getId());
        dto.setFilename(document.getFilename());
        dto.setFileType(document.getFileType());
        dto.setFileSize(document.getFileSize());
        dto.setStatus(document.getStatus());
        dto.setDocumentType(document.getDocumentType());
        dto.setConfidence(document.getConfidence());
        dto.setSummary(document.getSummary());
        dto.setValidationScore(document.getValidationScore());
        dto.setIsValid(document.getIsValid());
        
        if (document.getValidationIssues() != null && !document.getValidationIssues().isEmpty()) {
            dto.setValidationIssues(List.of(document.getValidationIssues().split("; ")));
        }
        
        dto.setCreatedAt(document.getCreatedAt());
        dto.setUpdatedAt(document.getUpdatedAt());
        
        return dto;
    }
}