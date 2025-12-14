package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.repository.ReportRepository;
import com.recorever.recorever_backend.repository.ReportScheduleRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReportMonitorService {

    private final ReportRepository reportRepository;
    private final ReportScheduleRepository reportScheduleRepository;
    private final NotificationService notificationService;

    public ReportMonitorService(ReportRepository reportRepository, 
                                ReportScheduleRepository reportScheduleRepository,
                                NotificationService notificationService) {
        this.reportRepository = reportRepository;
        this.reportScheduleRepository = reportScheduleRepository;
        this.notificationService = notificationService;
    }

    /**
     * Executes every minute: "0 * * * * ?"
     */
    @Scheduled(cron = "0 * * * * ?")
    @Transactional 
    public void monitorReportsForExpiration() {
        LocalDateTime now = LocalDateTime.now();
        
        // Find and Mark for Notification 1 (6 days)
        List<Integer> notify1ReportIds = reportScheduleRepository.findReportsForNotify1(now);
        if (!notify1ReportIds.isEmpty()) {
            System.out.println("SCHEDULER: Found " + notify1ReportIds.size() + " reports for NOTIFICATION 1 (6-day warning).");

            for (Integer reportId : notify1ReportIds) {
                Report report = reportRepository.getReportById(reportId);
                if (report != null) {
                    String message = String.format("Your report '%s' is scheduled for deletion in about 1 day. Status: %s. You may update it to keep it active.", 
                                                    report.getItem_name(), report.getStatus());
                    notificationService.create(report.getUser_id(), reportId, message);
                }
            }
            reportScheduleRepository.markNotify1Sent(notify1ReportIds);
        }

        // Find and Mark for Notification 2 (7 days, before deletion)
        List<Integer> notify2ReportIds = reportScheduleRepository.findReportsForNotify2(now);
        if (!notify2ReportIds.isEmpty()) {
            System.out.println("SCHEDULER: Found " + notify2ReportIds.size() + " reports for NOTIFICATION 2 (Final 15-min warning).");

            for (Integer reportId : notify2ReportIds) {
                Report report = reportRepository.getReportById(reportId);
                if (report != null) {
                    String message = String.format("FINAL WARNING: Your report '%s' will be deleted in 15 minutes due to inactivity or no resolution. Status: %s.", 
                                                    report.getItem_name(), report.getStatus());
                    notificationService.create(report.getUser_id(), reportId, message);
                }
            }
            
            reportScheduleRepository.markNotify2Sent(notify2ReportIds);
        }

        List<Report> reportsToDelete = reportRepository.getReportsReadyForSoftDelete(now);
        
        // Execute Soft-Deletion (7 days + 15 min)
        int deletedCount = reportRepository.softDeleteExpiredReports(now);
        
        if (deletedCount > 0) {
            for (Report report : reportsToDelete) {
                if (report.is_deleted() == false) { 
                    String message = String.format("NOTICE: Your report for '%s' has been deleted due to expiration.",
                                                    report.getItem_name(), report.getReport_id());
                    notificationService.create(report.getUser_id(), report.getReport_id(), message);
                }
            }
        }
    }
}