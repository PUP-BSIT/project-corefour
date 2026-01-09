package com.recorever.recorever_backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "claims")
@Data
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "claim_id")
    @JsonProperty("claim_id")
    private int claimId;

    @Column(name = "report_id")
    @JsonProperty("report_id")
    private int reportId;

    @Column(name = "claimant_name")
    @JsonProperty("claimant_name")
    private String claimantName;

    @Column(name = "contact_email")
    @JsonProperty("contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    @JsonProperty("contact_phone")
    private String contactPhone;

    @Column(name = "admin_remarks", columnDefinition = "TEXT")
    @JsonProperty("admin_remarks")
    private String adminRemarks;

    @Column(name = "created_at")
    @JsonProperty("created_at")
    private String createdAt;

    @Column(name = "matching_lost_report_id")
    @JsonProperty("matching_lost_report_id")
    private Integer matchingLostReportId;

    // Hides status from the JSON response
    @Transient
    @JsonIgnore 
    private Integer userId; 

    @Transient
    @JsonIgnore
    private String status;

    @Transient
    @JsonIgnore
    private String claimCode;
}