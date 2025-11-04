package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ReportController {

    @Autowired
    private ReportService service;

    @PostMapping("/report")
    public ResponseEntity<?> createReport(Authentication authentication,
                                             @RequestParam String type,
                                             @RequestParam String item_name,
                                             @RequestParam String location,
                                             @RequestParam String description) {
        User authenticatedUser = (User) authentication.getPrincipal();
        int userId = authenticatedUser.getUser_id();

        Map<String, Object> result = service.create(userId, type, item_name, location, description);
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/reports")
    public ResponseEntity<List<Report>> getAllReports() {
        return ResponseEntity.ok(service.listAll());
    }

    @GetMapping("/report/{id}")
    public ResponseEntity<?> getReport(@PathVariable int id) {
        Report report = service.getById(id);
        if (report == null) return ResponseEntity.status(404).body("Report not found");
        return ResponseEntity.ok(report);
    }

    @PutMapping("/report/{id}")
    public ResponseEntity<?> updateReport(Authentication authentication,
                                             @PathVariable int id,
                                             @RequestParam(required = false) String item_name,
                                             @RequestParam(required = false) String location,
                                             @RequestParam(required = false) String description) {
        
        Report report = service.getById(id);
        if (report == null) {
             return ResponseEntity.status(404).body("Report not found");
        }
        
        User authenticatedUser = (User) authentication.getPrincipal();
        if (report.getUser_id() != authenticatedUser.getUser_id()) {
            return ResponseEntity.status(403).body("You are not authorized to update this report.");
        }

        // Check: User cannot edit an approved, matched, or claimed report.
        if (report.getStatus().equalsIgnoreCase("approved") || 
            report.getStatus().equalsIgnoreCase("matched") || 
            report.getStatus().equalsIgnoreCase("claimed")) {
            return ResponseEntity.status(403).body("Cannot update a report that has already been approved, matched, or claimed.");
        }

        boolean updated = service.updateEditableFields(
            id, 
            item_name, 
            location, 
            description
        );
        if (!updated) return ResponseEntity.badRequest().body("Invalid update or no fields provided.");
        return ResponseEntity.ok(Map.of("success", true, "message", "Report updated successfully."));
    }

    @DeleteMapping("/report/{id}")
    public ResponseEntity<?> deleteReport(Authentication authentication, @PathVariable int id) {
        
        Report report = service.getById(id);
        if (report == null) {
             return ResponseEntity.status(404).body("Report not found");
        }
        
        User authenticatedUser = (User) authentication.getPrincipal();
        if (report.getUser_id() != authenticatedUser.getUser_id()) {
            return ResponseEntity.status(403).body("You are not authorized to delete this report.");
        }
        
        boolean deleted = service.delete(id);
        if (!deleted) return ResponseEntity.status(404).body("Report not found or already deleted");
        return ResponseEntity.ok(Map.of("success", true, "message", "Report deleted successfully."));
    }

    @PutMapping("/report/{id}/codes")
    public ResponseEntity<?> updateCodes(Authentication authentication,
                                             @PathVariable int id,
                                             @RequestParam String surrender_code,
                                             @RequestParam String claim_code) {
        return ResponseEntity.status(403).body("This endpoint is deprecated. Use the /api/admin endpoints for code management.");
    }
}