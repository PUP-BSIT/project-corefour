package com.recorever.recorever_backend.controller;

// Service & Repository Imports
import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.service.ReportService;

//DTO imports
import com.recorever.recorever_backend.dto.ReportCreationDTO;
import com.recorever.recorever_backend.dto.ReportResponseDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ReportController {

    @Autowired
    private ReportService service;

    private ReportResponseDTO mapToReportResponseDTO(Report report) {
        ReportResponseDTO dto = new ReportResponseDTO();
        dto.setReport_id(report.getReport_id());
        dto.setUser_id(report.getUser_id());
        dto.setType(report.getType());
        dto.setItem_name(report.getItem_name()); 
        dto.setLocation(report.getLocation());
        dto.setDate_reported(report.getDate_reported());
        dto.setDate_resolved(report.getDate_resolved());
        dto.setDescription(report.getDescription());
        dto.setStatus(report.getStatus());
        dto.setSurrender_code(report.getSurrender_code());
        dto.setClaim_code(report.getClaim_code());
        return dto;
    }

    @PostMapping("/report")
    public ResponseEntity<?> createReport( Authentication authentication,
            @Valid @RequestBody ReportCreationDTO reportDto) {
            
        User authenticatedUser = (User) authentication.getPrincipal();
        int userId = authenticatedUser.getUser_id();

        Map<String, Object> result = service.create(
            userId, 
            reportDto.getType(), 
            reportDto.getItem_name(), 
            reportDto.getLocation(), 
            reportDto.getDescription()
        );
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/reports")
    public ResponseEntity<List<ReportResponseDTO>> getAllReports() {
        List<Report> reports = service.listAll();

        List<ReportResponseDTO> responseList = reports.stream()
            .map(this::mapToReportResponseDTO)
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(responseList);
    }

    @GetMapping("reports/type/{type}")
    public List<Report> getReportsByType(
            @PathVariable String type, 
            @RequestParam(required = false) String status) {
        
        if (status != null && !status.isEmpty()) {
            return service.getReportsByTypeAndStatus(type, status);
        } else {
            return service.getReportsByType(type);
        }
    }

    @GetMapping("/report/{id}")
    public ResponseEntity<?> getReport(@PathVariable int id) {
        Report report = service.getById(id);
        if (report == null) return ResponseEntity.status(404).body("Report not found");

        ReportResponseDTO responseDto = mapToReportResponseDTO(report);
        return ResponseEntity.ok(responseDto);
    }

    @PutMapping("/report/{id}")
    public ResponseEntity<?> updateReport(
            Authentication authentication,
            @PathVariable int id,
            @RequestBody ReportCreationDTO reportDto) {
        
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
            reportDto.getItem_name(), 
            reportDto.getLocation(), 
            reportDto.getDescription()
        );

        if (!updated) return ResponseEntity.badRequest().body("Invalid update or no fields provided.");
        
        Report updatedReport = service.getById(id);
        return ResponseEntity.ok(mapToReportResponseDTO(updatedReport));
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