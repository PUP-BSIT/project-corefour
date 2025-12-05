package com.recorever.recorever_backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ClaimCreationDTO {

    @NotNull(message = "Report ID is required")
    @Min(value = 1, message = "Report ID must be a positive integer")
    private Integer report_id;
}