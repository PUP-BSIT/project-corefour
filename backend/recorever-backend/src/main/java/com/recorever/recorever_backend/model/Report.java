package com.recorever.recorever_backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    @JsonProperty("report_id")
    private int reportId;

    @Column(name = "user_id")
    @JsonProperty("user_id")
    private int userId;

    private String type;

    @JsonProperty("item_name")
    private String itemName;

    private String location;

    @Column(name = "date_lost_found")
    @JsonProperty("date_lost_found")
    private String dateLostFound;

    @Column(name = "date_reported")
    @JsonProperty("date_reported")
    private String dateReported;

    @Column(name = "date_resolved")
    @JsonProperty("date_resolved")
    private String dateResolved;

    private String description;

    private String status;

    @Column(name = "surrender_code")
    @JsonProperty("surrender_code")
    private String surrenderCode;

    @Column(name = "is_deleted")
    @JsonProperty("is_deleted")
    private boolean isDeleted;

    @Transient
    @JsonProperty("claim_code")
    private String claimCode;

    @Transient
    @JsonProperty("reporter_name")
    private String reporterName;

    @Transient
    @JsonProperty("expiry_date")
    private String expiryDate;
    
    @Transient
    @JsonProperty("reporter_profile_picture")
    private String reporterProfilePicture;

    @OneToMany(mappedBy = "reportId", fetch = FetchType.LAZY)
    private List<Image> images = new ArrayList<>();
}