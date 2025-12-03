package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.dto.ClaimCreationDTO;
import com.recorever.recorever_backend.dto.ClaimResponseDTO;
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
import java.util.stream.Collectors;

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
        String proofDescription = claimCreationDTO.getProof_description();

        if (reportService.getById(reportId) == null) {
            return ResponseEntity.status(404).body("Target report not found.");
        }

        Map<String, Object> result = service.create(reportId, userId, proofDescription);
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/claims")
    public ResponseEntity<List<ClaimResponseDTO>> getAllClaims() {
        List<Claim> claims = service.listAllClaims();
        List<ClaimResponseDTO> responseDTOs = claims.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responseDTOs);
    }

    @GetMapping("/claims/user/{userId}")
    public ResponseEntity<List<ClaimResponseDTO>> getClaimsByUser(@PathVariable int userId) {
        List<Claim> claims = service.listClaimsByUserId(userId);
        List<ClaimResponseDTO> responseDTOs = claims.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responseDTOs);
    }
    
    @GetMapping("/claim/{id}")
    public ResponseEntity<?> getSingleClaim(@PathVariable int id) {
        Claim claim = service.getById(id);
        if (claim == null) {
            return ResponseEntity.status(404).body("Claim not found.");
        }
        return ResponseEntity.ok(convertToDto(claim));
    }
    
    /**
     * Helper method to map Claim model to ClaimResponseDTO.
     */
    private ClaimResponseDTO convertToDto(Claim claim) {
        ClaimResponseDTO dto = new ClaimResponseDTO();
        dto.setClaim_id(claim.getClaim_id());
        dto.setReport_id(claim.getReport_id());
        dto.setProof_description(claim.getProof_description());
        dto.setItem_name(claim.getItem_name());
        dto.setStatus(claim.getStatus());
        dto.setCreated_at(claim.getCreated_at());
        return dto;
    }
}