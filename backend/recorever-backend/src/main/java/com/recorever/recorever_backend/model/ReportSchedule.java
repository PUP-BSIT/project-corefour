package com.recorever.recorever_backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportSchedule {
    private Long scheduleId; 
    private Integer reportId;
    private LocalDateTime notify1Time;
    private LocalDateTime notify2Time;
    private LocalDateTime deleteTime;
    private Boolean notify1Sent = false;
    private Boolean notify2Sent = false;
}