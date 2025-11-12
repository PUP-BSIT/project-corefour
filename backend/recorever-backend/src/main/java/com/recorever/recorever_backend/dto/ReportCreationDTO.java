package com.recorever.recorever_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReportCreationDTO {

    @NotBlank(message = "Report type is required")
    @Pattern(regexp = "lost|found", message = "Type must be 'lost' or 'found'")
    private String type; 
    
    @NotBlank(message = "Item name is required")
    private String item_name;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 500, message = "Description must be between 10 and 500 characters")
    private String description;
}