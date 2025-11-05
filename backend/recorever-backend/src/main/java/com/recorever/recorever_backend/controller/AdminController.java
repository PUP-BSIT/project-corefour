package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.service.ClaimService;
import com.recorever.recorever_backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')") // Global security: Only users with ROLE_ADMIN can access this controller
public class AdminController {

    @Autowired
    private ReportService reportService;
    
    @Autowired
    private ClaimService claimService;

    // --- REPORT MANAGEMENT ENDPOINTS ---
    @GetMapping("/reports/pending")
    public ResponseEntity<List<Report>> getPendingReports() {
        return ResponseEntity.ok(reportService.listByStatus("pending")); 
    }

    @PutMapping("/report/{id}/approve")
    public ResponseEntity<?> approveReport(@PathVariable int id) {
        Report report = reportService.getById(id);
        if (report == null) {
            return ResponseEntity.status(404).body("Report not found.");
        }
        if (!"pending".equalsIgnoreCase(report.getStatus())) {
            return ResponseEntity.badRequest().body("Report status is not 'pending'. Only pending reports can be approved.");
        }

        boolean approved = reportService.approveAndPost(id); 

        if (!approved) {
             return ResponseEntity.badRequest().body("Report approval failed.");
        }
        
        return ResponseEntity.ok(Map.of("success", true, "message", 
            report.getType().equals("lost") 
                ? "Lost report approved and posted." 
                : "Found report manually approved and posted."));
    }

    // --- CLAIM MANAGEMENT ENDPOINTS ---
    @GetMapping("/claims")
    public ResponseEntity<?> getAllClaims() {
        return ResponseEntity.ok(claimService.listAllClaims());
    }

    @PutMapping("/claim/{id}/approve")
    public ResponseEntity<?> approveClaim(@PathVariable int id) {
        boolean updated = claimService.updateStatus(id, "approved");
        
        if (!updated) {
            return ResponseEntity.badRequest().body("Claim not found or approval failed.");
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Claim approved. Claim code generated and user notified."));
    }

    @PutMapping("/claim/{id}/finalize")
    public ResponseEntity<?> finalizeClaim(@PathVariable int id) {
        boolean updated = claimService.updateStatus(id, "claimed");
        
        if (!updated) {
            return ResponseEntity.badRequest().body("Claim not found or finalization failed.");
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Item successfully collected. Claim and Report statuses updated to 'claimed'."));
    }

    @PutMapping("/claim/{id}/reject")
    public ResponseEntity<?> rejectClaim(@PathVariable int id) {
        // Calls the business logic in ClaimService to update status and notify the user
        boolean updated = claimService.updateStatus(id, "rejected");
        
        if (!updated) {
            return ResponseEntity.badRequest().body("Claim not found or rejection failed.");
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Claim rejected and user notified."));
    }
}