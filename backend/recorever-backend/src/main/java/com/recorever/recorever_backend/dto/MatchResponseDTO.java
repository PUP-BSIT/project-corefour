package com.recorever.recorever_backend.dto;

import lombok.Data;

/**
 * Output DTO for returning Match data.
 */
@Data
public class MatchResponseDTO {
    private int match_id; // Corresponds to match_id in Match.java
    private int lost_report_id; // Corresponds to lost_report_id in Match.java
    private int found_report_id; // Corresponds to found_report_id in Match.java
    private String status; // Corresponds to status in Match.java ('pending', 'confirmed', 'rejected')
    private String created_at; // Corresponds to created_at in Match.java
}