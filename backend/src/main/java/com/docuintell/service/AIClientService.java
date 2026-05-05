package com.docuintell.service;

import com.docuintell.entity.Document;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class AIClientService {
    
    private static final Logger logger = LoggerFactory.getLogger(AIClientService.class);
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${ai.service.url}")
    private String aiServiceUrl;
    
    public AIClientService() {
        this.objectMapper = new ObjectMapper();
        this.restTemplate = new RestTemplate();
        logger.info("AIClientService initialized");
    }
    
    public DocumentService.ProcessingResponse processDocument(MultipartFile file) throws IOException {
        logger.info("Calling AI service at: {}", aiServiceUrl);
        
        try {
            // Build request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new org.springframework.core.io.ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });
            body.add("document_id", file.getOriginalFilename());
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            
            // Make request with timeout
            ResponseEntity<String> response = restTemplate.exchange(
                aiServiceUrl + "/process",
                HttpMethod.POST,
                requestEntity,
                String.class
            );
            
            logger.info("AI service response: {}", response.getStatusCode());
            
            // Parse response
            return objectMapper.readValue(response.getBody(), DocumentService.ProcessingResponse.class);
            
        } catch (Exception e) {
            logger.error("AI service error: {}", e.getMessage());
            throw new IOException("Failed to process document: " + e.getMessage(), e);
        }
    }
    
    public Map<String, Object> searchDocuments(String query, int limit) {
        logger.info("Searching documents: {}", query);
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("query", query);
            requestBody.put("limit", limit);
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                aiServiceUrl + "/search",
                HttpMethod.POST,
                requestEntity,
                String.class
            );
            
            return objectMapper.readValue(response.getBody(), Map.class);
            
        } catch (Exception e) {
            logger.error("Search error: {}", e.getMessage());
            return new HashMap<>();
        }
    }
    
    public Map<String, Object> healthCheck() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                aiServiceUrl + "/health",
                String.class
            );
            
            return objectMapper.readValue(response.getBody(), Map.class);
            
        } catch (Exception e) {
            logger.error("Health check error: {}", e.getMessage());
            Map<String, Object> result = new HashMap<>();
            result.put("status", "unhealthy");
            result.put("error", e.getMessage());
            return result;
        }
    }
}