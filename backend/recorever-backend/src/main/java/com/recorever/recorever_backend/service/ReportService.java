package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    @Autowired
    private ReportRepository repo;

    public Map<String, Object> create(int userId, String type, String itemName, String location, String description) {
        int id = repo.createReport(userId, type, itemName, location, description);
        return Map.of(
                "report_id", id,
                "status", "pending",
                "type", type,
                "item_name", itemName
        );
    }

    public List<Report> listAll() {
        return repo.getAllReports();
    }

    public Report getById(int id) {
        return repo.getReportById(id);
    }

    public boolean update(int id, String status, String dateResolved) {
        return repo.updateReport(id, status, dateResolved);
    }

    public boolean delete(int id) {
        return repo.deleteReport(id);
    }

    public boolean updateCodes(int id, String surrenderCode, String claimCode) {
        return repo.setClaimCodes(id, surrenderCode, claimCode);
    }
}