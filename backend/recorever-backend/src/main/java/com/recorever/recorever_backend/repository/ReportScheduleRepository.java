package com.recorever.recorever_backend.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class ReportScheduleRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // --- Service Layer Save Method ---
    public void saveSchedule(Integer reportId, LocalDateTime notify1Time, LocalDateTime notify2Time, LocalDateTime deleteTime) {
        String sql = """
            INSERT INTO report_schedules 
            (report_id, notify1_time, notify2_time, delete_time, notify1_sent, notify2_sent)
            VALUES (?, ?, ?, ?, 0, 0)
            """;
        jdbcTemplate.update(sql, reportId, notify1Time, notify2Time, deleteTime);
    }

    public List<Integer> findReportsForNotify1(LocalDateTime currentTime) {
        String sql = """
            SELECT rs.report_id
            FROM report_schedules rs
            JOIN reports r ON rs.report_id = r.report_id
            WHERE rs.notify1_sent = 0
            AND rs.notify1_time <= ?
            AND r.is_deleted = 0
            """;
        return jdbcTemplate.queryForList(sql, Integer.class, currentTime);
    }

    public List<Integer> findReportsForNotify2(LocalDateTime currentTime) {
        String sql = """
            SELECT rs.report_id
            FROM report_schedules rs
            JOIN reports r ON rs.report_id = r.report_id
            WHERE rs.notify2_sent = 0
            AND rs.notify2_time <= ?
            AND r.is_deleted = 0
            """;
        return jdbcTemplate.queryForList(sql, Integer.class, currentTime);
    }

    // UPDATE status for Notification 1 sent
    public int markNotify1Sent(List<Integer> reportIds) {
        if (reportIds.isEmpty()) return 0;
        String inSql = reportIds.stream().map(id -> "?").collect(Collectors.joining(","));
        String sql = "UPDATE report_schedules SET notify1_sent = 1 WHERE report_id IN (" + inSql + ")";
        return jdbcTemplate.update(sql, reportIds.toArray());
    }

    // UPDATE status for Notification 2 sent
    public int markNotify2Sent(List<Integer> reportIds) {
        if (reportIds.isEmpty()) return 0;
        String inSql = reportIds.stream().map(id -> "?").collect(Collectors.joining(","));
        String sql = "UPDATE report_schedules SET notify2_sent = 1 WHERE report_id IN (" + inSql + ")";
        return jdbcTemplate.update(sql, reportIds.toArray());
    }
}