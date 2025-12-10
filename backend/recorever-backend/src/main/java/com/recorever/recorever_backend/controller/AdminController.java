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
@PreAuthorize("hasRole('ADMIN')")
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
        return ResponseEntity.ok(claimService.listAllClaimsForAdmin());
    }

    @PutMapping("/claim/{id}/approve")
    public ResponseEntity<?> approveClaim(@PathVariable int id, @RequestBody(required = false) Map<String, String> body) {
        String remarks = (body != null && body.containsKey("admin_remarks")) 
            ? body.get("admin_remarks") 
            : "Approved by Admin";
            
        boolean updated = claimService.updateStatus(id, "approved", remarks);
        
        if (!updated) {
            return ResponseEntity.badRequest().body("Claim not found or approval failed.");
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Claim approved."));
    }

    @PutMapping("/claim/{id}/finalize")
    public ResponseEntity<?> finalizeClaim(@PathVariable int id, @RequestBody(required = false) Map<String, String> body) {
        String remarks = (body != null && body.containsKey("admin_remarks")) 
            ? body.get("admin_remarks") 
            : "Item collected";

        boolean updated = claimService.updateStatus(id, "claimed", remarks);
        
        if (!updated) {
            return ResponseEntity.badRequest().body("Claim not found or finalization failed.");
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Item successfully collected."));
    }

    @PutMapping("/claim/{id}/reject")
    public ResponseEntity<?> rejectClaim(@PathVariable int id, @RequestBody(required = false) Map<String, String> body) {
        String remarks = (body != null && body.containsKey("admin_remarks")) 
            ? body.get("admin_remarks") 
            : "Rejected by Admin";

        boolean updated = claimService.updateStatus(id, "rejected", remarks);
        
        if (!updated) {
            return ResponseEntity.badRequest().body("Claim not found or rejection failed.");
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Claim rejected."));
    }
}