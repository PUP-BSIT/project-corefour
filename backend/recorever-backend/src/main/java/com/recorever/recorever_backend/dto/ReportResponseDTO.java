package com.recorever.recorever_backend.dto;

import lombok.Data;
import java.util.List;

/**
 * Output DTO for returning Report data.
 * Controls visibility of sensitive internal fields (like is_deleted) and access codes.
 */
@Data
public class ReportResponseDTO {
    private int report_id;
    private int user_id;
    private String type; 
    private String item_name;
    private String location;
    private String date_lost_found;
    private String date_reported;
    private String date_resolved;
    private String description;
    private String status; 
    
    private String surrender_code;
    private String reporter_name;
    private List<ImageResponseDTO> images;
}