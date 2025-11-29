package com.recorever.recorever_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class ImageResponseDTO {
    private int imageId; 
    private String fileName;
    private String fileType;
    private Integer reportId;
    private Integer claimId;
    private LocalDateTime uploadedAt;
    private String imageUrl; // The public URL for the frontend
}