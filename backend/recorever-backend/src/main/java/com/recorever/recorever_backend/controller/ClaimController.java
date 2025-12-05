package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.dto.ClaimCreationDTO;
import com.recorever.recorever_backend.dto.ClaimResponseDTO;
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

    @PostMapping("/claim")
    public ResponseEntity<?> submitClaim(Authentication authentication, 
                                         @Valid @RequestBody ClaimCreationDTO claimCreationDTO) {
        
        User authenticatedUser = (User) authentication.getPrincipal();
        int userId = authenticatedUser.getUser_id();
        int reportId = claimCreationDTO.getReport_id().intValue();

        if (reportService.getById(reportId) == null) {
            return ResponseEntity.status(404).body("Target report not found.");
        }

        Map<String, Object> result = service.create(reportId, userId);
        
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/claims/report/{reportId}")
    public ResponseEntity<List<ClaimResponseDTO>> getClaimsByReport(@PathVariable int reportId) {
        List<ClaimResponseDTO> claims = service.getClaimsForReport(reportId);
        return ResponseEntity.ok(claims);
    }

    @GetMapping("/claim/ticket/{reportId}")
    public ResponseEntity<?> getMyTicketCode(Authentication authentication, 
                                             @PathVariable int reportId) {
        User authenticatedUser = (User) authentication.getPrincipal();
        int userId = authenticatedUser.getUser_id();
        
        String ticketCode = service.getClaimCode(userId, reportId);
        
        if (ticketCode == null) {
             return ResponseEntity.status(404).body("No ticket found for this item.");
        }
        
        return ResponseEntity.ok(Map.of("claim_code", ticketCode));
    }

    @PutMapping("/claim/{claimId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable int claimId, 
                                          @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String remarks = body.get("admin_remarks");
        
        boolean updated = service.updateStatus(claimId, status, remarks);
        
        if (updated) {
            return ResponseEntity.ok("Status updated successfully.");
        } else {
            return ResponseEntity.status(400).body("Failed to update status.");
        }
    }

    @GetMapping("/claims/user")
    public ResponseEntity<List<ClaimResponseDTO>> getMyClaims(Authentication authentication) {
        User authenticatedUser = (User) authentication.getPrincipal();

        List<ClaimResponseDTO> claims = service.getClaimsByUserId(authenticatedUser.getUser_id());
        return ResponseEntity.ok(claims);
    }
}