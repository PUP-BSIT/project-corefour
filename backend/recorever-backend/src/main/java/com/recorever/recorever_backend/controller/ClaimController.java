package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.dto.ClaimCreationDTO;
import com.recorever.recorever_backend.dto.ClaimResponseDTO;
import com.recorever.recorever_backend.dto.ManualClaimRequestDTO;
import com.recorever.recorever_backend.model.Claim;
import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.service.ClaimService;
import com.recorever.recorever_backend.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @PostMapping("/claim")
    public ResponseEntity<?> submitClaim(
            Authentication authentication,
            @Valid @RequestBody ClaimCreationDTO claimCreationDTO) {

        User authenticatedUser = (User) authentication.getPrincipal();
        int userId = authenticatedUser.getUserId();
        int reportId = claimCreationDTO.getReport_id().intValue();

        if (reportService.getById(reportId) == null) {
            return ResponseEntity.status(404)
                    .body("Target report not found.");
        }

        Map<String, Object> result = service.create(reportId, userId);

        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/claims/report/{reportId}")
    public ResponseEntity<List<ClaimResponseDTO>> getClaimsByReport(
            @PathVariable int reportId) {
        List<ClaimResponseDTO> claims = service.getClaimsForReport(reportId);
        return ResponseEntity.ok(claims);
    }

    @GetMapping("/claim/ticket/{reportId}")
    public ResponseEntity<?> getMyTicketCode(
            Authentication authentication,
            @PathVariable int reportId) {
        User authenticatedUser = (User) authentication.getPrincipal();
        int userId = authenticatedUser.getUserId();

        String ticketCode = service.getClaimCode(userId, reportId);

        if (ticketCode == null) {
            return ResponseEntity.status(404)
                    .body("No ticket found for this item.");
        }

        return ResponseEntity.ok(Map.of("claim_code", ticketCode));
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

    @GetMapping("/claims/user")
    public ResponseEntity<List<ClaimResponseDTO>> getMyClaims(
            Authentication authentication) {
        User authenticatedUser = (User) authentication.getPrincipal();

        List<ClaimResponseDTO> claims = service
                .getClaimsByUserId(authenticatedUser.getUserId());
        return ResponseEntity.ok(claims);
    }
}