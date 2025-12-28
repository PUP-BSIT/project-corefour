package com.recorever.recorever_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "images")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_id")
    private int imageId; 

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType;

    @Column(nullable = false, unique = true)
    private String filePath; 

    @Column(name = "report_id")
    private Integer reportId; 
    
    @Column(name = "claim_id")
    private Integer claimId; 

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt = LocalDateTime.now();
    
    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE", name = "is_deleted")
    private boolean isDeleted; 

    // Utility constructor for Report uploads
    public Image(String fileName, String fileType, String filePath, Integer reportId) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.filePath = filePath;
        this.reportId = reportId;
        this.claimId = null;
        this.uploadedAt = LocalDateTime.now();
        this.isDeleted = false;
    }

    // Utility constructor for Claim uploads
    public Image(String fileName, String fileType, String filePath, Integer claimId, boolean isClaim) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.filePath = filePath;
        this.reportId = null;
        this.claimId = claimId;
        this.uploadedAt = LocalDateTime.now();
        this.isDeleted = false;
    }
}