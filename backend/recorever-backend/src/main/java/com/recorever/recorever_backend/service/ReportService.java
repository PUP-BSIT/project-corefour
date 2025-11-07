package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ReportService {

    @Autowired
    private ReportRepository repo;
    
    @Autowired
    private MatchService matchService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ImageService imageService;

    private static final int ADMIN_USER_ID = 1; // temporary admin user ID

    public Map<String, Object> create(int userId, String type, String itemName, String location, String description, MultipartFile file) {
            
        // Create the Report (Metadata only)
        int id = repo.createReport(userId, type, itemName, location, description);
        
        // Only upload if a file is present
        if (file != null && !file.isEmpty()) {
            try {
                // Call ImageService to save the file and image metadata
                imageService.uploadReportImage(id, file);
            } catch (IOException e) {
                System.err.println("Failed to upload image for report " + id + ": " + e.getMessage());
            }
        }
        
        // Set Surrender Code and Notify Admin
        String surrenderCode = null;
        if ("found".equalsIgnoreCase(type)) {
            surrenderCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            repo.setInitialSurrenderCode(id, surrenderCode);
        }

        notificationService.create(ADMIN_USER_ID, id, 
            String.format("New PENDING report (ID #%d) submitted: %s.", id, itemName));
        
        return Map.of(
                "report_id", id,
                "status", "pending",
                "type", type,
                "item_name", itemName,
                "surrender_code", surrenderCode != null ? surrenderCode : "N/A"
        );
    }

    public boolean approveAndPost(int reportId) {
        boolean updated = repo.updateReport(reportId, "approved", null); 
        
        if (updated) {
            Report postedReport = repo.getReportById(reportId);
            if (postedReport != null) {
                matchService.findAndCreateMatch(postedReport);

                notificationService.create(postedReport.getUser_id(), reportId, 
                    String.format("Your report (%s) has been APPROVED and posted to the public board.", postedReport.getItem_name()));
            }
        }
        return updated;
    }

    public List<Report> listAll() { return repo.getAllReports(); }

    public List<Report> listByStatus(String status) {
        return repo.getReportsByStatus(status); }

    public Report getById(int id) {
        return repo.getReportById(id); }
    
    public boolean updateEditableFields(int id, 
                                        String itemName,
                                        String location,
                                        String description) {
        return repo.updateEditableReportFields(id, itemName, location, description); }

    public boolean update(int id, String status, String dateResolved) {
        return repo.updateReport(id, status, dateResolved); }
    
    public boolean delete(int id) { return repo.deleteReport(id); }

    public boolean updateCodes(int id, String surrenderCode, String claimCode) {
        return repo.setClaimCodes(id, surrenderCode, claimCode); }
}