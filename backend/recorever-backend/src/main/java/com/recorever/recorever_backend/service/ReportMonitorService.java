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
        List<Integer> notify1Ids = reportScheduleRepository
                .findReportsForNotify1(now);
        
        if (!notify1Ids.isEmpty()) {
            System.out.println("SCHEDULER: Found " + notify1Ids.size() + 
                    " reports for NOTIFICATION 1 (6-day warning).");

            for (Integer reportId : notify1Ids) {
                reportRepository.findByReportIdAndIsDeletedFalse(reportId)
                    .ifPresent(report -> {
                        String msg = String.format("Your report '%s' is " +
                            "scheduled for deletion in about 1 day. Status: " +
                            "%s. You may update it to keep it active.", 
                            report.getItemName(), report.getStatus());
                        notificationService.create(report.getUserId(), 
                            reportId, msg, true);
                    });
            }
            reportScheduleRepository.markNotify1Sent(notify1Ids);
        }

        // Find and Mark for Notification 2 (7 days, before deletion)
        List<Integer> notify2Ids = reportScheduleRepository
                .findReportsForNotify2(now);
        
        if (!notify2Ids.isEmpty()) {
            System.out.println("SCHEDULER: Found " + notify2Ids.size() + 
                    " reports for NOTIFICATION 2 (Final 15-min warning).");

            for (Integer reportId : notify2Ids) {
                reportRepository.findByReportIdAndIsDeletedFalse(reportId)
                    .ifPresent(report -> {
                        String msg = String.format("FINAL WARNING: Your " +
                            "report '%s' will be deleted in 15 minutes due " +
                            "to inactivity. Status: %s.", 
                            report.getItemName(), report.getStatus());
                        notificationService.create(report.getUserId(), 
                            reportId, msg, true);
                    });
            }
            reportScheduleRepository.markNotify2Sent(notify2Ids);
        }

        // Get list of reports ready for deletion before executing the update
        List<Report> reportsToDelete = reportScheduleRepository
                .findReportsReadyForSoftDelete(now);
        
        // Execute Soft-Deletion (7 days + 15 min)
        int deletedCount = reportRepository.softDeleteExpiredReports(now);
        
        if (deletedCount > 0) {
            for (Report report : reportsToDelete) {
                String msg = String.format("NOTICE: Your report for '%s' " +
                        "has been deleted due to expiration.",
                        report.getItemName());
                notificationService.create(report.getUserId(), 
                        report.getReportId(), msg, true);
            }
        }
    }
}