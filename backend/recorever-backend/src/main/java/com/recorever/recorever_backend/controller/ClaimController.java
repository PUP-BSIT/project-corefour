package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.model.Claim;
import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.service.ClaimService;
import com.recorever.recorever_backend.service.ReportService;
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
                                          @RequestBody Map<String, String> body) {
        
        User authenticatedUser = (User) authentication.getPrincipal();
        int userId = authenticatedUser.getUser_id();
        
        String reportIdStr = body.get("report_id");
        String proofDescription = body.get("proof_description");

        if (reportIdStr == null || proofDescription == null || proofDescription.isEmpty()) {
            return ResponseEntity.badRequest().body("Missing report_id or proof_description.");
        }
        
        int reportId;
        try {
            reportId = Integer.parseInt(reportIdStr);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Invalid report ID format.");
        }
        
        if (reportService.getById(reportId) == null) {
            return ResponseEntity.status(404).body("Target report not found.");
        }

        Map<String, Object> result = service.create(reportId, userId, proofDescription);
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/claims")
    public ResponseEntity<List<Claim>> getAllClaims() {
        return ResponseEntity.ok(service.listAllClaims());
    }
    
    @GetMapping("/claim/{id}")
    public ResponseEntity<?> getSingleClaim(@PathVariable int id) {
        Claim claim = service.getById(id);
        if (claim == null) {
            return ResponseEntity.status(404).body("Claim not found.");
        }
        return ResponseEntity.ok(claim);
    }
}