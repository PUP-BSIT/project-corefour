package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    private static final int ADMIN_USER_ID = 1; // temporary admin user ID

    public Map<String, Object> create(int userId,
                                      String type,
                                      String itemName,
                                      String location,
                                      String description) {
        int id = repo.createReport(userId, type, itemName, location, description);
        
        // Generate and set SURRENDER CODE (only for found items)
        String surrenderCode = null;
        if ("found".equalsIgnoreCase(type)) {
            surrenderCode = UUID.randomUUID()
                    .toString().substring(0, 8)
                    .toUpperCase();
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

    public List<Report> listAll() { return repo.getAllReports(); }

    public List<Report> listByStatus(String status) {
        return repo.getReportsByStatus(status); }

    public List<Report> getReportsByType(String type) {
        return repo.getReportsByType(type);
    }

    public List<Report> getReportsByTypeAndStatus(String type, String status) {
        return repo.getReportsByTypeAndStatus(type, status);
    }

    public boolean adminUpdateStatus(int id, String status) {
        String dateResolved = null;

        if ("claimed".equalsIgnoreCase(status) || "rejected".equalsIgnoreCase(status)) {
            dateResolved = java.time.LocalDateTime.now().toString();
        }
        
        boolean updated = repo.updateReport(id, status, dateResolved);
        
        if (updated) {
             Report report = repo.getReportById(id);
             if (report != null) {

                 if ("approved".equalsIgnoreCase(status)) {
                    matchService.findAndCreateMatch(report); 
                 }

                 notificationService.create(report.getUser_id(), id, 
                     String.format(
                        "Your report for '%s' status changed to '%s'.",
                        report.getItem_name(), status));
            }
        }
        return updated;
    }

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