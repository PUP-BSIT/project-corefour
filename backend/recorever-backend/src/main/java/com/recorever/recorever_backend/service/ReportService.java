package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.repository.ReportRepository;
import com.recorever.recorever_backend.repository.ReportScheduleRepository; 
import com.recorever.recorever_backend.repository.ImageRepository;
import com.recorever.recorever_backend.model.Image;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; 

import java.time.LocalDate; 
import java.time.LocalDateTime; 
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class ReportService {

    @Autowired
    private ReportRepository repo;
    
    @Autowired
    private MatchService matchService;

    @Autowired
    private NotificationService notificationService;

    @Autowired 
    private ReportScheduleRepository scheduleRepo;

    @Autowired
    private ImageRepository imageRepo; 

    private static final int ADMIN_USER_ID = 1;

    @Transactional
    public Map<String, Object> create(int userId,
                                      String type,
                                      String itemName,
                                      String location,
                                      String description) {
        int id = repo.createReport(userId, type, itemName, location, description);

        String surrenderCode = null;
        if ("found".equalsIgnoreCase(type)) {
            surrenderCode = UUID.randomUUID()
                    .toString().substring(0, 8)
                    .toUpperCase();
            repo.setInitialSurrenderCode(id, surrenderCode);
        }

        if ("lost".equalsIgnoreCase(type)) { 
            LocalDateTime postTime = LocalDateTime.now(); 
            LocalDate postDate = postTime.toLocalDate();
            LocalTime midnight = LocalTime.MIDNIGHT;

            LocalDateTime notify1Time = postDate.plusDays(6).atTime(midnight);
            LocalDateTime notify2Time = postDate.plusDays(7).atTime(midnight);
            LocalDateTime deleteTime = postDate.plusDays(7).atTime(0, 15, 0); 

            scheduleRepo.saveSchedule(id, notify1Time, notify2Time, deleteTime);
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

    public List<Report> searchReports(Integer userId,
                                      String type,
                                      String status) {

        return repo.searchReports(userId, type, status);
    }

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
             Report report = this.getById(id);
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
        Report report = repo.getReportById(id);

        if (report != null) {
             List<Image> images = imageRepo.findByReportIdAndIsDeletedFalse(id);
             report.setImages(images);
        }
        return report;
    }

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

    public Map<String, Object> getDashboardData(int days) {
    int total = repo.countTotalReports();
    int claimed = repo.countReportsByStatus("claimed");
    int pending = repo.countReportsByStatus("pending");
    
    int lost = repo.countReportsByType("lost");
    int found = repo.countReportsByType("found");
    
    String ratio = lost + "/" + found; 

    List<Map<String, Object>> dbData = repo.getReportsOverTime(days);
    
    Map<String, Long> dataMap = dbData.stream().collect(Collectors.toMap(
        m -> (String) m.get("label"),
        m -> ((Number) m.get("value")).longValue()
    ));

    List<Map<String, Object>> chartData = new ArrayList<>();
    LocalDate today = LocalDate.now();
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM-dd");

    for (int i = days - 1; i >= 0; i--) {
        LocalDate date = today.minusDays(i);
        String dateKey = date.format(formatter);
        
        long count = dataMap.getOrDefault(dateKey, 0L);

        Map<String, Object> entry = new HashMap<>();
        entry.put("date", dateKey);
        entry.put("count", count);
        chartData.add(entry);
    }

    Map<String, Object> stats = new HashMap<>();
    stats.put("totalReports", total);
    stats.put("successfullyClaimed", claimed);
    stats.put("pendingAction", pending);
    stats.put("lostFoundRatio", ratio);

    Map<String, Object> response = new HashMap<>();
    response.put("stats", stats);
    response.put("reportsOverTime", chartData);

    return response;
}
}