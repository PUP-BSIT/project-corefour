package com.recorever.recorever_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "report_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(name = "report_id", nullable = false)
    private Integer reportId;

    @Column(name = "notify1_time")
    private LocalDateTime notify1Time;

    @Column(name = "notify2_time")
    private LocalDateTime notify2Time;

    @Column(name = "delete_time")
    private LocalDateTime deleteTime;

    @Column(name = "notify1_sent")
    private Boolean notify1Sent = false;

    @Column(name = "notify2_sent")
    private Boolean notify2Sent = false;
}