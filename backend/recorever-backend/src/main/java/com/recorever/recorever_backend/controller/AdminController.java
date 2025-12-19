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

    @PutMapping("/report/{id}/status")
    public ResponseEntity<?> updateReportStatus(@PathVariable int id, 
                                               @RequestBody Map<String, String> body) {
        String status = body.get("status");
        
        if (status == null || status.isEmpty()) {
            return ResponseEntity.badRequest().body("Status field is required.");
        }

        boolean updated = reportService.adminUpdateStatus(id, status);
        if (!updated) {
            return ResponseEntity.badRequest().body("Report not found or status update failed.");
        }
        
        return ResponseEntity.ok(Map.of("success", true, "message", "Report status updated to " + status));
    }

    // --- CLAIM MANAGEMENT ENDPOINTS ---
    @GetMapping("/claims")
    public ResponseEntity<?> getAllClaims() {
        return ResponseEntity.ok(claimService.listAllClaimsForAdmin());
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats(@RequestParam(defaultValue = "15") int days) {
        return ResponseEntity.ok(reportService.getDashboardData(days));
    }

    // for future cleaning up
    // @PutMapping("/claim/{id}/approve")
    // public ResponseEntity<?> approveClaim(@PathVariable int id, @RequestBody(required = false) Map<String, String> body) {
    //     String remarks = (body != null && body.containsKey("admin_remarks")) 
    //         ? body.get("admin_remarks") 
    //         : "Approved by Admin";
            
    //     boolean updated = claimService.updateStatus(id, "approved", remarks);
        
    //     if (!updated) {
    //         return ResponseEntity.badRequest().body("Claim not found or approval failed.");
    //     }
    //     return ResponseEntity.ok(Map.of("success", true, "message", "Claim approved."));
    // }

    // @PutMapping("/claim/{id}/finalize")
    // public ResponseEntity<?> finalizeClaim(@PathVariable int id, @RequestBody(required = false) Map<String, String> body) {
    //     String remarks = (body != null && body.containsKey("admin_remarks")) 
    //         ? body.get("admin_remarks") 
    //         : "Item collected";

    //     boolean updated = claimService.updateStatus(id, "claimed", remarks);
        
    //     if (!updated) {
    //         return ResponseEntity.badRequest().body("Claim not found or finalization failed.");
    //     }
    //     return ResponseEntity.ok(Map.of("success", true, "message", "Item successfully collected."));
    // }

    // @PutMapping("/claim/{id}/reject")
    // public ResponseEntity<?> rejectClaim(@PathVariable int id, @RequestBody(required = false) Map<String, String> body) {
    //     String remarks = (body != null && body.containsKey("admin_remarks")) 
    //         ? body.get("admin_remarks") 
    //         : "Rejected by Admin";

    //     boolean updated = claimService.updateStatus(id, "rejected", remarks);
        
    //     if (!updated) {
    //         return ResponseEntity.badRequest().body("Claim not found or rejection failed.");
    //     }
    //     return ResponseEntity.ok(Map.of("success", true, "message", "Claim rejected."));
    // }
}