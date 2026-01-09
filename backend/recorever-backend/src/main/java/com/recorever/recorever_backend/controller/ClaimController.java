package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.dto.ClaimResponseDTO;
import com.recorever.recorever_backend.dto.ManualClaimRequestDTO;
import com.recorever.recorever_backend.model.Claim;
import com.recorever.recorever_backend.service.ClaimService;
import com.recorever.recorever_backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ClaimController {

    @Autowired
    private ClaimService service;

    @Autowired
    private ReportService reportService;

    @PostMapping("/claims")
    public ResponseEntity<?> createManualClaim(
            @RequestBody ManualClaimRequestDTO request) {
        try {
            if (reportService.getById(
                    request.getReport_id().intValue()) == null) {
                return ResponseEntity.status(404)
                        .body("Target report not found.");
            }

            Claim newClaim = service.createManualClaim(request);
            return ResponseEntity.status(201).body(newClaim);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error creating claim: " + e.getMessage());
        }
    }

    @GetMapping("/claims/report/{reportId}")
    public ResponseEntity<List<ClaimResponseDTO>> getClaimsByReport(
            @PathVariable int reportId) {
        List<ClaimResponseDTO> claims = service.getClaimsForReport(reportId);
        return ResponseEntity.ok(claims);
    }

    @GetMapping("/claim/report/{reportId}")
    public ResponseEntity<?> getClaimByReportId(@PathVariable int reportId) {
        Claim claim = service.getClaimByReportId(reportId);

        if (claim == null) {
            return ResponseEntity.status(404)
                    .body("No claim found for this report.");
        }

        return ResponseEntity.ok(claim);
    }
}