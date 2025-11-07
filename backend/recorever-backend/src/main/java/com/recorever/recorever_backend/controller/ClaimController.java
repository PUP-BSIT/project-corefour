package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.model.Claim;
import com.recorever.recorever_backend.model.Image;
import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.service.ClaimService;
import com.recorever.recorever_backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.recorever.recorever_backend.service.ImageService;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ClaimController {

    @Autowired
    private ClaimService service;
    
    @Autowired
    private ReportService reportService; 

    @Autowired
    private ImageService imageService;

@PostMapping("/claim")
    public ResponseEntity<?> submitClaim(Authentication authentication, 
                                          @RequestParam String report_id, 
                                          @RequestParam String proof_description,
                                          @RequestParam(value = "file", required = false) MultipartFile file) {
        
        User authenticatedUser = (User) authentication.getPrincipal();
        int userId = authenticatedUser.getUser_id();
        
        String reportIdStr = report_id;
        String proofDescription = proof_description;

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
            return ResponseEntity.status(404).body("Target report not found or is deleted.");
        }

        Map<String, Object> result = service.create(reportId, userId, proofDescription, file); 
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

    @PostMapping("/claim/{id}/upload-image")
    public ResponseEntity<?> uploadClaimImage(Authentication authentication,
                                            @PathVariable int id,
                                            @RequestParam("file") MultipartFile file) {

        User authenticatedUser = (User) authentication.getPrincipal();
        Claim claim = service.getById(id);

        if (claim == null) {
            return ResponseEntity.status(404).body("Target claim not found.");
        }

        // only the claim creator can upload the proof image
        if (claim.getUser_id() != authenticatedUser.getUser_id()) {
            return ResponseEntity.status(403).body("You are not authorized to upload proof for this claim.");
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty.");
        }

        try {
            Image image = imageService.uploadClaimImage(id, file);
            return ResponseEntity.status(201).body(Map.of(
                "success", true, 
                "message", "Proof image uploaded and linked to claim successfully.", 
                "image_id", image.getImage_id(),
                "file_path", image.getFile_path()
            ));
        } catch (Exception e) {
            System.err.println("File upload failed: " + e.getMessage());
            return ResponseEntity.status(500).body("File upload failed due to server error: " + e.getMessage());
        }
    }
}