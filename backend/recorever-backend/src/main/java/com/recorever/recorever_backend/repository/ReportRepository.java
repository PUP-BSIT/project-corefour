package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.Report;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

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
      r.setDate_lost_found(rs.getString("date_lost_found"));
      r.setDate_reported(rs.getString("date_reported"));
      r.setDate_resolved(rs.getString("date_resolved"));
      r.setDescription(rs.getString("description"));
      r.setStatus(rs.getString("status"));
      r.setSurrender_code(rs.getString("surrender_code"));
      r.set_deleted(rs.getBoolean("is_deleted"));

      try {
        r.setExpiry_date(rs.getString("expiry_date")); 
      } catch (SQLException e) {
        r.setExpiry_date(null);
      }

      try {
        r.setReporter_name(rs.getString("reporter_name"));
      } catch (SQLException e) {
        r.setReporter_name(null);
      }
      return r;
    }
  };

  public int createReport(int userId, String type, String itemName, String location, String description, String dateLostFound) {
    String sql = "INSERT INTO reports (user_id, type, item_name, location, description, date_lost_found, status, date_reported, is_deleted) "
        +
        "VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), 0)";
    jdbcTemplate.update(sql, userId, type, itemName, location, description, dateLostFound);
    return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
  }

  public List<Report> getAllReports(int page, int size) {
      int offset = (page - 1) * size;
      String sql = """
          SELECT r.*, u.name AS reporter_name, rs.notify2_time AS expiry_date
          FROM reports r
          LEFT JOIN users u ON r.user_id = u.user_id
          LEFT JOIN report_schedules rs ON r.report_id = rs.report_id
          WHERE r.is_deleted = 0
          ORDER BY r.date_reported DESC
          LIMIT ? OFFSET ?
          """;
      return jdbcTemplate.query(sql, reportMapper, size, offset);
  }

  public List<Report> searchReports(Integer userId,
                                    String type,
                                    String status,
                                    String query,
                                    int page,
                                    int size) {
      int offset = (page - 1) * size;
      
      StringBuilder sql = new StringBuilder("""
          SELECT r.*, u.name AS reporter_name, rs.notify2_time AS expiry_date
          FROM reports r
          LEFT JOIN users u ON r.user_id = u.user_id
          LEFT JOIN report_schedules rs ON r.report_id = rs.report_id
          WHERE r.is_deleted = 0
          """);

      List<Object> params = new ArrayList<>();

      if (userId != null) {
        sql.append(" AND r.user_id = ?");
        params.add(userId);
      }

      if (type != null && !type.isEmpty()) {
        sql.append(" AND r.type = ?");
        params.add(type);
      }

      if (status != null && !status.isEmpty()) {
        sql.append(" AND r.status = ?");
        params.add(status);
      }

      if (query != null && !query.trim().isEmpty()) {
          sql.append(" AND (r.item_name LIKE ? OR r.description LIKE ? OR r.location LIKE ? OR u.name LIKE ?)");
          String searchPattern = "%" + query.trim() + "%";

          for (int i = 0; i < 4; i++) {
              params.add(searchPattern);
          }
      }

      sql.append(" ORDER BY r.date_reported DESC LIMIT ? OFFSET ?");
      params.add(size);
      params.add(offset);

    return jdbcTemplate.query(sql.toString(), reportMapper, params.toArray());
  }

  public List<Report> getAllReports() {
      String sql = "SELECT r.*, u.name AS reporter_name FROM reports r " +
                  "LEFT JOIN users u ON r.user_id = u.user_id " +
                  "WHERE r.is_deleted = 0 ORDER BY r.date_reported DESC";
      return jdbcTemplate.query(sql, reportMapper);
  }

  public int countSearchReports(Integer userId,
                                String type,
                                String status,
                                String query) {
      StringBuilder sql = new StringBuilder("""
          SELECT COUNT(*)
          FROM reports r
          LEFT JOIN users u ON r.user_id = u.user_id
          WHERE r.is_deleted = 0
      """);
      List<Object> params = new ArrayList<>();

      if (userId != null) {
          sql.append(" AND r.user_id = ?");
          params.add(userId);
      }

      if (type != null && !type.isEmpty()) {
          sql.append(" AND r.type = ?");
          params.add(type);
      }

      if (status != null && !status.isEmpty()) {
          sql.append(" AND r.status = ?");
          params.add(status);
      }

      if (query != null && !query.trim().isEmpty()) {
          sql.append(" AND (r.item_name LIKE ? OR r.description LIKE ? OR r.location LIKE ? OR u.name LIKE ?)");
          String searchPattern = "%" + query.trim() + "%";
          for (int i = 0; i < 4; i++) params.add(searchPattern);
      }

      return jdbcTemplate.queryForObject(sql.toString(), Integer.class, params.toArray());
  }

  public List<Report> getReportsByStatus(String status) {
    String sql = """
        SELECT r.*, u.name AS reporter_name, rs.notify2_time AS expiry_date
        FROM reports r
        LEFT JOIN users u ON r.user_id = u.user_id
        LEFT JOIN report_schedules rs ON r.report_id = rs.report_id
        WHERE r.status = ? AND r.is_deleted = 0
        ORDER BY r.date_reported DESC
        """;
    return jdbcTemplate.query(sql, reportMapper, status);
  }

  public List<Report> getReportsByType(String type) {
    String sql = """
        SELECT r.*, u.name AS reporter_name, rs.notify2_time AS expiry_date
        FROM reports r
        LEFT JOIN users u ON r.user_id = u.user_id
        LEFT JOIN report_schedules rs ON r.report_id = rs.report_id
        WHERE r.type = ? AND r.is_deleted = 0
        ORDER BY r.date_reported DESC
        """;
    return jdbcTemplate.query(sql, reportMapper, type);
  }

  public List<Report> getReportsByTypeAndStatus(String type, String status) {
    String sql = """
        SELECT r.*, u.name AS reporter_name, rs.notify2_time AS expiry_date
        FROM reports r
        LEFT JOIN users u ON r.user_id = u.user_id
        LEFT JOIN report_schedules rs ON r.report_id = rs.report_id
        WHERE r.type = ? AND r.status = ? AND r.is_deleted = 0
        ORDER BY r.date_reported DESC
        """;
    return jdbcTemplate.query(sql, reportMapper, type, status);
  }

  public List<Report> getReportsReadyForSoftDelete(LocalDateTime currentTime) {
    String sql = """
        SELECT r.*, u.name AS reporter_name
        FROM reports r
        JOIN report_schedules rs ON r.report_id = rs.report_id
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.is_deleted = 0 AND rs.delete_time <= ?
        """;
    return jdbcTemplate.query(sql, reportMapper, currentTime);
  }

  public Report getReportById(int id) {
    try {
      String sql = """
          SELECT r.*, u.name AS reporter_name, rs.notify2_time AS expiry_date
          FROM reports r
          LEFT JOIN users u ON r.user_id = u.user_id
          LEFT JOIN report_schedules rs ON r.report_id = rs.report_id
          WHERE r.report_id = ? AND r.is_deleted = 0
          """;
      return jdbcTemplate.queryForObject(sql, reportMapper, id);
    } catch (EmptyResultDataAccessException e) {
      return null;
    }
  }

  public boolean setInitialSurrenderCode(int id, String surrenderCode) {
    String sql = "UPDATE reports SET surrender_code = ? WHERE report_id = ?";
    return jdbcTemplate.update(sql, surrenderCode, id) > 0;
  }

  public boolean updateEditableReportFields(int id, String itemName, String location, String description) {
    StringBuilder sql = new StringBuilder("UPDATE reports SET ");
    List<Object> params = new ArrayList<>();

    if (itemName != null && !itemName.isEmpty()) {
      sql.append("item_name=?, ");
      params.add(itemName);
    }
    if (location != null && !location.isEmpty()) {
      sql.append("location=?, ");
      params.add(location);
    }
    if (description != null && !description.isEmpty()) {
      sql.append("description=?, ");
      params.add(description);
    }
    if (params.isEmpty()) {
      return false;
    }
    sql.setLength(sql.length() - 2);
    sql.append(" WHERE report_id=? AND is_deleted = 0");
    params.add(id);

    return jdbcTemplate.update(sql.toString(), params.toArray()) > 0;
  }

  public boolean updateReport(int id, String status, String dateResolved) {
    String sql = "UPDATE reports SET status=?, date_resolved=? WHERE report_id=? AND is_deleted = 0";
    return jdbcTemplate.update(sql, status, dateResolved, id) > 0;
  }

  // New Method for updating the date
  public boolean updateReportDate(int id, String dateReported) {
    String sql = "UPDATE reports SET date_reported=? WHERE report_id=? AND is_deleted = 0";
    return jdbcTemplate.update(sql, dateReported, id) > 0;
  }

  public boolean updateStatus(int reportId, String status) {
    String sql = "UPDATE reports SET status = ? WHERE report_id = ?";
    return jdbcTemplate.update(sql, status, reportId) > 0;
  }

  public boolean deleteReport(int id) {
    String sql = "UPDATE reports SET is_deleted = 1 WHERE report_id=? AND is_deleted = 0";
    return jdbcTemplate.update(sql, id) > 0;
  }

  public boolean setClaimCodes(int id, String surrenderCode, String claimCode) {
    String sql = "UPDATE reports SET surrender_code=?, claim_code=? WHERE report_id=? AND is_deleted = 0";
    return jdbcTemplate.update(sql, surrenderCode, claimCode, id) > 0;
  }

  public int softDeleteExpiredReports(LocalDateTime currentTime) {
    String sql = """
        UPDATE reports r
        JOIN report_schedules rs ON r.report_id = rs.report_id
        SET r.is_deleted = 1
        WHERE r.is_deleted = 0 AND rs.delete_time <= ?
        """;
    return jdbcTemplate.update(sql, currentTime);
  }

  public int countTotalReports() {
    String sql = "SELECT COUNT(*) FROM reports WHERE is_deleted = 0";
    return jdbcTemplate.queryForObject(sql, Integer.class);
  }

  public int countReportsByStatus(String status) {
    String sql = "SELECT COUNT(*) FROM reports WHERE status = ? AND is_deleted = 0";
    return jdbcTemplate.queryForObject(sql, Integer.class, status);
  }

  public int countReportsByType(String type) {
    String sql = "SELECT COUNT(*) FROM reports WHERE type = ? AND is_deleted = 0";
    return jdbcTemplate.queryForObject(sql, Integer.class, type);
  }

  public List<java.util.Map<String, Object>> getReportsOverTime(int days) {
    String sql = """
            SELECT DATE_FORMAT(date_reported, '%m-%d') as label,
                   COUNT(*) as value
            FROM reports
            WHERE date_reported >= DATE_SUB(NOW(), INTERVAL ? DAY)
              AND is_deleted = 0
            GROUP BY DATE_FORMAT(date_reported, '%m-%d')
            ORDER BY label ASC
        """;
    return jdbcTemplate.queryForList(sql, days);
  }

  public List<String> getTopLocations(int limit) {
      String sql = """
          SELECT location 
          FROM reports 
          WHERE is_deleted = 0 AND location IS NOT NULL AND location != ''
          GROUP BY location 
          ORDER BY COUNT(*) DESC 
          LIMIT ?
          """;
      return jdbcTemplate.queryForList(sql, String.class, limit);
    }
}