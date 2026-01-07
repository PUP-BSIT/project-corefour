package com.recorever.recorever_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "match_id")
    private int matchId;

    @Column(name = "lost_report_id", nullable = false)
    private int lostReportId;

    @Column(name = "found_report_id", nullable = false)
    private int foundReportId;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", updatable = false)
    private String createdAt;

    // Getters and Setters
    public int getMatch_id() { return matchId; }
    public void setMatch_id(int match_id) { this.matchId = match_id; }

    public int getLost_report_id() { return lostReportId; }
    public void setLost_report_id(int lost_report_id) {
        this.lostReportId = lost_report_id; }

    public int getFound_report_id() { return foundReportId; }
    public void setFound_report_id(int found_report_id) {
        this.foundReportId = found_report_id; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreated_at() { return createdAt; }
    public void setCreated_at(String created_at) {
        this.createdAt = created_at; }
}