package com.recorever.recorever_backend.service;

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
    private final NotificationService notificationService; // Kept for compatibility

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
        
        // 1. Find and Mark for Notification 1 (6 days)
        List<Integer> notify1ReportIds = reportScheduleRepository.findReportsForNotify1(now);
        if (!notify1ReportIds.isEmpty()) {
            System.out.println("SCHEDULER: Found " + notify1ReportIds.size() + " reports for NOTIFICATION 1.");
            
            // TODO(Riomalos): Send 6-day expiration warning notification here.
            
            reportScheduleRepository.markNotify1Sent(notify1ReportIds);
        }

        // 2. Find and Mark for Notification 2 (7 days, before deletion)
        List<Integer> notify2ReportIds = reportScheduleRepository.findReportsForNotify2(now);
        if (!notify2ReportIds.isEmpty()) {
            System.out.println("SCHEDULER: Found " + notify2ReportIds.size() + " reports for NOTIFICATION 2.");
            
            // TODO(Riomalos): Send final 15-minute deletion warning notification here.
            
            reportScheduleRepository.markNotify2Sent(notify2ReportIds);
        }

        // 3. Execute Soft-Deletion (7 days + 15 min)
        int deletedCount = reportRepository.softDeleteExpiredReports(now);
        
        if (deletedCount > 0) {
            System.out.println("Soft-deleted " + deletedCount + " expired reports.");
        }
    }
}