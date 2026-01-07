package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.repository.ReportRepository;
import com.recorever.recorever_backend.repository.ReportScheduleRepository;
import com.recorever.recorever_backend.repository.UserRepository;
import com.recorever.recorever_backend.repository.ImageRepository;
import com.recorever.recorever_backend.model.Image;
import com.recorever.recorever_backend.model.ReportSchedule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

    @Autowired
    private UserRepository userRepository;

    private static final int ADMIN_USER_ID = 1;

    @Transactional
    public Map<String, Object> create(int userId, String type, String itemName,
            String location, String description, String dateLostFound) {

        Report report = new Report();
        report.setUserId(userId);
        report.setType(type);
        report.setItemName(itemName);
        report.setLocation(location);
        report.setDescription(description);
        report.setDateLostFound(dateLostFound);
        report.setStatus("pending");
        report.setDeleted(false);
        report.setDateReported(LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        String surrenderCode = null;
        if ("found".equalsIgnoreCase(type)) {
            surrenderCode = UUID.randomUUID().toString()
                    .substring(0, 8).toUpperCase();
            report.setSurrenderCode(surrenderCode);
        }

        Report savedReport = repo.save(report);
        int id = savedReport.getReportId();

        if ("lost".equalsIgnoreCase(type)) {
            LocalDate postDate = LocalDate.now();
            LocalTime midnight = LocalTime.MIDNIGHT;

            LocalDateTime n1 = postDate.plusDays(6).atTime(midnight);
            LocalDateTime n2 = postDate.plusDays(7).atTime(midnight);
            LocalDateTime dlt = postDate.plusDays(7).atTime(0, 15, 0);

            ReportSchedule schedule = new ReportSchedule();
            schedule.setReportId(id);
            schedule.setNotify1Time(n1);
            schedule.setNotify2Time(n2);
            schedule.setDeleteTime(dlt);
            scheduleRepo.save(schedule);
        }

        notificationService.create(ADMIN_USER_ID, id, String.format(
                "New PENDING report (ID #%d) submitted: %s.", id, itemName),
                false);

        return Map.of(
            "report_id", id,
            "status", "pending",
            "date_lost_found", dateLostFound != null ? dateLostFound : "N/A",
            "type", type,
            "item_name", itemName,
            "surrender_code", surrenderCode != null ? surrenderCode : "N/A");
    }

    public Map<String, Object> listAll(int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size);
        List<Report> items = repo.findAllActive(pageable);

        items.forEach(report -> {
            userRepository.findById(report.getUserId()).ifPresent(user -> {
                report.setReporterName(user.getName());
            });
        });

        int totalItems = (int) repo.countByIsDeletedFalse();
        return createPaginationResponse(items, totalItems, page, size);
    }

    public Map<String, Object> searchReports(Integer userId, String type,
            String status, String query, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size);
        List<Report> items = repo.searchReports(userId, type, status, query,
                pageable);
        int totalItems = repo.countSearchReports(userId, type, status, query);

        if (!items.isEmpty()) {
            List<Integer> reportIds = items.stream()
                    .map(Report::getReportId)
                    .collect(Collectors.toList());

            List<Image> allImages = imageRepo
                    .findByReportIdInAndIsDeletedFalse(reportIds);

            Map<Integer, List<Image>> imagesByReportId = allImages.stream()
                    .collect(Collectors.groupingBy(Image::getReportId));

            items.forEach(report -> {
                report.setImages(imagesByReportId
                        .getOrDefault(report.getReportId(), new ArrayList<>()));

                userRepository.findById(report.getUserId()).ifPresent(user -> {
                    report.setReporterName(user.getName());
                });

                // Set expiry_date from schedule
                scheduleRepo.findByReportId(report.getReportId()).ifPresent(s -> {
                    if (s.getDeleteTime() != null) {
                        report.setExpiryDate(s.getDeleteTime().toString());
                    }
                });
            });
        }
        return createPaginationResponse(items, totalItems, page, size);
    }

    private Map<String, Object> createPaginationResponse(List<Report> items,
            int totalItems, int page, int size) {
        Map<String, Object> response = new HashMap<>();
        response.put("items", items);
        response.put("totalItems", totalItems);
        response.put("currentPage", page);
        response.put("totalPages", (int) Math.ceil((double) totalItems / size));
        return response;
    }

    public List<Report> listByStatus(String status) {
        return repo.findByStatusAndIsDeletedFalseOrderByDateReportedDesc(status);
    }

    public List<Report> getReportsByType(String type) {
        return repo.findByTypeAndIsDeletedFalseOrderByDateReportedDesc(type);
    }

    public List<Report> getReportsByTypeAndStatus(String type, String status) {
        return repo.findByTypeAndStatusAndIsDeletedFalseOrderByDateReportedDesc(
                type, status);
    }

    @Transactional
    public boolean adminUpdateStatus(int id, String status) {
        return repo.findByReportIdAndIsDeletedFalse(id).map(report -> {
            String dateResolved = null;
            if ("claimed".equalsIgnoreCase(status) ||
                    "rejected".equalsIgnoreCase(status)) {
                dateResolved = LocalDateTime.now().toString();
            }

            report.setStatus(status);
            report.setDateResolved(dateResolved);

            if ("approved".equalsIgnoreCase(status)) {
                String now = LocalDateTime.now().format(
                        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                report.setDateReported(now);
            }

            repo.save(report);

            if ("approved".equalsIgnoreCase(status)) {
                matchService.findAndCreateMatch(report);
            }

            notificationService.create(report.getUserId(), id, String.format(
                    "Your report for '%s' status changed to '%s'.",
                    report.getItemName(), status), true);

            return true;
        }).orElse(false);
    }

    public Report getById(int id) {
        return repo.findByReportIdAndIsDeletedFalse(id).map(report -> {
            List<Image> images = imageRepo.findByReportIdAndIsDeletedFalse(id);
            report.setImages(images);

            userRepository.findById(report.getUserId()).ifPresent(user -> {
                report.setReporterName(user.getName());
            });

            scheduleRepo.findByReportId(id).ifPresent(schedule -> {
                report.setExpiryDate(schedule.getDeleteTime().toString());
            });

            return report;
        }).orElse(null);
    }

    @Transactional
    public boolean updateEditableFields(int id, String itemName,
            String location, String description) {
        return repo.findByReportIdAndIsDeletedFalse(id).map(report -> {
            if (itemName != null) report.setItemName(itemName);
            if (location != null) report.setLocation(location);
            if (description != null) report.setDescription(description);
            repo.save(report);
            return true;
        }).orElse(false);
    }

    @Transactional
    public boolean update(int id, String status, String dateResolved) {
        return repo.findByReportIdAndIsDeletedFalse(id).map(report -> {
            report.setStatus(status);
            report.setDateResolved(dateResolved);
            repo.save(report);
            return true;
        }).orElse(false);
    }

    @Transactional
    public boolean delete(int id) {
        return repo.softDeleteById(id) > 0;
    }

    @Transactional
    public boolean updateCodes(int id, String surrenderCode, String claimCode) {
        return repo.findByReportIdAndIsDeletedFalse(id).map(report -> {
            report.setSurrenderCode(surrenderCode);
            report.setClaimCode(claimCode); 
            repo.save(report);
            return true;
        }).orElse(false);
    }

    public Map<String, Object> getDashboardData(int days) {
        int total = (int) repo.countByIsDeletedFalse();
        int claimed = repo.countByStatusAndIsDeletedFalse("claimed");
        int pending = repo.countByStatusAndIsDeletedFalse("pending");

        int lost = repo.countByTypeAndIsDeletedFalse("lost");
        int found = repo.countByTypeAndIsDeletedFalse("found");

        String ratio = lost + "/" + found;

        List<Map<String, Object>> dbData = repo.getReportsOverTime(days);
        Map<String, Long> dataMap = dbData.stream().collect(Collectors.toMap(
                m -> (String) m.get("label"),
                m -> ((Number) m.get("value")).longValue()));

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

        Map<String, Object> stats = Map.of(
            "totalReports", total,
            "successfullyClaimed", claimed,
            "pendingAction", pending,
            "lostFoundRatio", ratio
        );

        return Map.of("stats", stats, "reportsOverTime", chartData);
    }

    public List<String> getTopLocations() {
        return repo.getTopLocations();
    }
}