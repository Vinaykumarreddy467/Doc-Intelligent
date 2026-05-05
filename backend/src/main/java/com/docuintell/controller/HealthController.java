package com.docuintell.controller;

import com.docuintell.dto.ApiResponse;
import com.docuintell.service.AIClientService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {
    
    private static final Logger logger = LoggerFactory.getLogger(HealthController.class);
    
    private final AIClientService aiClientService;
    
    @Autowired
    public HealthController(AIClientService aiClientService) {
        this.aiClientService = aiClientService;
    }
    
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> health = new HashMap<>();
        
        // Check backend
        health.put("backend", "healthy");
        
        // Check AI service
        try {
            Map<String, Object> aiHealth = aiClientService.healthCheck();
            health.put("aiService", aiHealth.get("status"));
            health.put("model", aiHealth.get("model"));
        } catch (Exception e) {
            health.put("aiService", "unavailable");
            health.put("aiServiceError", e.getMessage());
        }
        
        return ResponseEntity.ok(ApiResponse.success(health));
    }
    
    @PostMapping("/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(
            @RequestBody Map<String, Object> request) {
        String query = (String) request.get("query");
        Integer limit = request.get("limit") != null ? 
                (Integer) request.get("limit") : 5;
        
        try {
            Map<String, Object> results = aiClientService.searchDocuments(query, limit);
            return ResponseEntity.ok(ApiResponse.success(results));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Search failed", e.getMessage()));
        }
    }
}