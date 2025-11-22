package com.recorever.recorever_backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClaimCreationDTO {

    @NotNull(message = "Report ID is required")
    @Min(value = 1, message = "Report ID must be a positive integer")
    private Integer report_id;

    @NotBlank(message = "Proof description is required")
    @Size(min = 10, max = 500, message = "Proof description must be between 10 and 500 characters")
    private String proof_description;
}