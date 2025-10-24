package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.Report;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
public class ReportRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<Report> reportMapper = new RowMapper<>() {
        @Override
        public Report mapRow(ResultSet rs, int rowNum) throws SQLException {
            Report r = new Report();
            r.setReport_id(rs.getInt("report_id"));
            r.setUser_id(rs.getInt("user_id"));
            r.setType(rs.getString("type"));
            r.setItem_name(rs.getString("item_name"));
            r.setLocation(rs.getString("location"));
            r.setDate_reported(rs.getString("date_reported"));
            r.setDate_resolved(rs.getString("date_resolved"));
            r.setDescription(rs.getString("description"));
            r.setStatus(rs.getString("status"));
            r.setSurrender_code(rs.getString("surrender_code"));
            r.setClaim_code(rs.getString("claim_code"));
            r.setIs_deleted(rs.getBoolean("is_deleted"));
            return r;
        }
    };

    public int createReport(int userId, String type, String itemName, String location, String description) {
        String sql = "INSERT INTO reports (user_id, type, item_name, location, description, status, date_reported, is_deleted) " +
                     "VALUES (?, ?, ?, ?, ?, 'pending', NOW(), 0)";
        jdbcTemplate.update(sql, userId, type, itemName, location, description);
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
    }

    public List<Report> getAllReports() {
        String sql = "SELECT * FROM reports WHERE is_deleted = 0 ORDER BY date_reported DESC";
        return jdbcTemplate.query(sql, reportMapper);
    }

    public Report getReportById(int id) {
        try {
            String sql = "SELECT * FROM reports WHERE report_id = ? AND is_deleted = 0";
            return jdbcTemplate.queryForObject(sql, reportMapper, id);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public boolean updateReport(int id, String status, String dateResolved) {
        String sql = "UPDATE reports SET status=?, date_resolved=? WHERE report_id=? AND is_deleted = 0";
        return jdbcTemplate.update(sql, status, dateResolved, id) > 0;
    }

    // ✅ Soft delete: only marks as deleted
    public boolean deleteReport(int id) {
        String sql = "UPDATE reports SET is_deleted = 1 WHERE report_id=? AND is_deleted = 0";
        return jdbcTemplate.update(sql, id) > 0;
    }

    public boolean setClaimCodes(int id, String surrenderCode, String claimCode) {
        String sql = "UPDATE reports SET surrender_code=?, claim_code=? WHERE report_id=? AND is_deleted = 0";
        return jdbcTemplate.update(sql, surrenderCode, claimCode, id) > 0;
    }
}
