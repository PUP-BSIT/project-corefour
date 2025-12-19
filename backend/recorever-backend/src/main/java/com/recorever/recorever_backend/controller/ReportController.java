package com.recorever.recorever_backend.controller;

// Service & Repository Imports
import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.service.ReportService;

// Image Imports
import com.recorever.recorever_backend.service.ImageService;
import com.recorever.recorever_backend.model.Image;

// DTO imports
import com.recorever.recorever_backend.dto.ReportCreationDTO;
import com.recorever.recorever_backend.dto.ReportResponseDTO;
import com.recorever.recorever_backend.dto.ImageResponseDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api")
public class ReportController {

    @Autowired
    private ReportService service;

    @Autowired
    private ImageService imageService;

    private ImageResponseDTO convertToImageDto(Image image) {
        if (image == null || image.isDeleted()) return null;
        
        ImageResponseDTO dto = new ImageResponseDTO();
        dto.setImageId(image.getImageId());
        dto.setFileName(image.getFileName());
        dto.setFileType(image.getFileType());
        dto.setReportId(image.getReportId());
        dto.setClaimId(image.getClaimId());
        dto.setUploadedAt(image.getUploadedAt());

        String imageUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/image/download/")
                .path(image.getFilePath()) 
                .toUriString();
        dto.setImageUrl(imageUrl);
        
        return dto;
    }

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
        dto.setReporter_name(report.getReporter_name());

        if (report.getImages() != null) {
            dto.setImages(report.getImages().stream()
                .filter(img -> !img.isDeleted())
                .map(this::convertToImageDto)
                .collect(Collectors.toList()));
        }
        return dto;
    }

    @PostMapping("/reports/full-submit") 
    public ResponseEntity<ReportResponseDTO> submitFullReport(
            Authentication authentication,
            @Valid @ModelAttribute ReportCreationDTO reportDto) {

        User authenticatedUser = (User) authentication.getPrincipal();
        int userId = authenticatedUser.getUser_id();

        Map<String, Object> creationResult = service.create( 
            userId, 
            reportDto.getType(), 
            reportDto.getItem_name(), 
            reportDto.getLocation(), 
            reportDto.getDescription()
        );

        Integer newReportId = (Integer) creationResult.get("report_id");

        List<MultipartFile> files = reportDto.getFiles();

        if (files != null && !files.isEmpty() && files.get(0).getSize() > 0) {
            files.forEach(file -> {
                String uniqueFileName = imageService.storeFile(file);
                
                Image image = new Image(
                    file.getOriginalFilename(),
                    file.getContentType(), 
                    uniqueFileName, 
                    newReportId 
                );

                imageService.saveImageMetadata(image);
            });
        }

        Report finalReport = service.getById(newReportId);
        
        if (finalReport == null) {
             return ResponseEntity.status(500).body(null); 
        }

        return ResponseEntity.status(201).body(mapToReportResponseDTO(finalReport));
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
    public ResponseEntity<List<ReportResponseDTO>> getReports(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer user_id) {
        
        List<Report> reports = service.searchReports(user_id, type, status);

        List<ReportResponseDTO> responseList = reports.stream()
            .map(this::mapToReportResponseDTO)
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(responseList);
    }

    @GetMapping("reports/type/{type}")
    public ResponseEntity<List<ReportResponseDTO>> getReportsByType(
            @PathVariable String type, 
            @RequestParam(required = false) String status) {
        
        List<Report> reports;
        
        if (status != null && !status.isEmpty()) {
            reports = service.getReportsByTypeAndStatus(type, status);
        } else {
            reports = service.getReportsByType(type);
        }

        List<ReportResponseDTO> responseList = reports.stream()
                .map(this::mapToReportResponseDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
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