package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ReportController {

    @Autowired
    private ReportService service;

    @PostMapping("/report")
    public ResponseEntity<?> createReport(@RequestParam int user_id,
                                          @RequestParam String type,
                                          @RequestParam String item_name,
                                          @RequestParam String location,
                                          @RequestParam String description) {
        Map<String, Object> result = service.create(user_id, type, item_name, location, description);
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
    public ResponseEntity<?> updateReport(@PathVariable int id,
                                          @RequestParam String status,
                                          @RequestParam(required = false) String date_resolved) {
        boolean updated = service.update(id, status, date_resolved);
        if (!updated) return ResponseEntity.badRequest().body("Invalid update");
        return ResponseEntity.ok(Map.of("success", true, "message", "Report updated successfully."));
    }

    @DeleteMapping("/report/{id}")
    public ResponseEntity<?> deleteReport(@PathVariable int id) {
        boolean deleted = service.delete(id);
        if (!deleted) return ResponseEntity.status(404).body("Report not found");
        return ResponseEntity.ok(Map.of("success", true, "message", "Report deleted successfully."));
    }

    @PutMapping("/report/{id}/codes")
    public ResponseEntity<?> updateCodes(@PathVariable int id,
                                         @RequestParam String surrender_code,
                                         @RequestParam String claim_code) {
        boolean updated = service.updateCodes(id, surrender_code, claim_code);
        if (!updated) return ResponseEntity.badRequest().body("Failed to update codes");
        return ResponseEntity.ok(Map.of("success", true, "message", "Codes updated successfully."));
    }
}
