package com.docuintell.repository;

import com.docuintell.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {
    
    List<Document> findByStatus(String status);
    
    List<Document> findByDocumentType(String documentType);
    
    @Query("SELECT d FROM Document d WHERE d.isValid = false AND d.status = 'needs_review'")
    List<Document> findDocumentsNeedingReview();
    
    @Query("SELECT COUNT(d) FROM Document d WHERE d.status = ?1")
    Long countByStatus(String status);
    
    @Query("SELECT d FROM Document d ORDER BY d.createdAt DESC")
    List<Document> findAllOrderByCreatedAtDesc();
}