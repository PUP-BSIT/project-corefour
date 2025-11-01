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

    @PutMapping("/report/{id}/surrender")
    public ResponseEntity<?> surrenderReport(@PathVariable int id, 
                                             @RequestBody Map<String, String> body) {
        String surrenderCode = body.get("surrender_code");
        
        if (surrenderCode == null || surrenderCode.isEmpty()) {
             return ResponseEntity.badRequest().body("Surrender code is required for handover verification.");
        }

        boolean updated = reportService.handleSurrender(id, surrenderCode); 
        
        if (!updated) {
            return ResponseEntity.badRequest().body("Surrender failed: Report not found, status is not pending, or code is invalid.");
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Item received and report officially posted (status: approved)."));
    }

    // --- CLAIM MANAGEMENT ENDPOINTS ---
    @PutMapping("/claim/{id}/approve")
    public ResponseEntity<?> approveClaim(@PathVariable int id) {
        // Calls the business logic in ClaimService to update status to 'claimed', generate claim code, and notify the user
        boolean updated = claimService.updateStatus(id, "claimed");
        
        if (!updated) {
            return ResponseEntity.badRequest().body("Claim not found or approval failed.");
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Claim approved. Codes generated and user notified."));
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