package com.docuintell.repository;

import com.docuintell.entity.ValidationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ValidationRecordRepository extends JpaRepository<ValidationRecord, String> {
    
    Optional<ValidationRecord> findByDocumentId(String documentId);
}