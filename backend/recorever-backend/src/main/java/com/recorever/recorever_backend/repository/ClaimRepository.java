package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.dto.ClaimResponseDTO;
import com.recorever.recorever_backend.dto.ReportResponseDTO;
import com.recorever.recorever_backend.model.Claim;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class ClaimRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<Claim> claimMapper = (rs, rowNum) -> {
        Claim c = new Claim();
        c.setClaim_id(rs.getInt("claim_id"));
        c.setReport_id(rs.getInt("report_id"));
        c.setUser_id(rs.getInt("user_id"));
        c.setClaim_code(rs.getString("claim_code"));
        c.setAdmin_remarks(rs.getString("admin_remarks"));
        c.setStatus(rs.getString("status"));
        c.setCreated_at(rs.getString("created_at"));
        
        return c;
    };

    public int createClaim(int reportId, int userId, String claimCode) {
        String sql = "INSERT INTO claims (report_id, user_id, claim_code, status, created_at) " +
                     "VALUES (?, ?, ?, 'pending', NOW())";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, reportId);
            ps.setInt(2, userId);
            ps.setString(3, claimCode); 
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            return keyHolder.getKey().intValue();
        } else {
            throw new RuntimeException("Failed to retrieve new claim ID");
        }
    }

    public List<ClaimResponseDTO> getClaimsByUserIdDTO(int userId) {
        String sql = """
            SELECT 
                c.claim_id, c.report_id, c.user_id, c.status AS claim_status, 
                c.admin_remarks, c.claim_code, c.created_at,
                u.name AS user_name,
                r.type, r.item_name, r.location, r.description, 
                r.date_reported, r.status AS report_status, r.surrender_code,
                ru.name AS reporter_name
            FROM claims c
            JOIN users u ON c.user_id = u.user_id
            JOIN reports r ON c.report_id = r.report_id
            LEFT JOIN users ru ON r.user_id = ru.user_id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            ClaimResponseDTO claim = new ClaimResponseDTO();
            
            // --- 1. Map Claim Details ---
            claim.setClaim_id(rs.getInt("claim_id"));
            claim.setReport_id(rs.getInt("report_id"));
            claim.setUser_id(rs.getInt("user_id"));
            claim.setUser_name(rs.getString("user_name"));
            claim.setStatus(rs.getString("claim_status")); 
            claim.setAdmin_remarks(rs.getString("admin_remarks"));
            claim.setClaim_code(rs.getString("claim_code"));
            claim.setCreated_at(rs.getString("created_at"));

            // --- 2. Map Report Details ---
            ReportResponseDTO report = new ReportResponseDTO();
            report.setReport_id(rs.getInt("report_id"));
            report.setType(rs.getString("type"));
            report.setItem_name(rs.getString("item_name"));
            report.setLocation(rs.getString("location"));
            report.setDescription(rs.getString("description"));
            report.setDate_reported(rs.getString("date_reported"));
            report.setStatus(rs.getString("report_status")); 
            report.setSurrender_code(rs.getString("surrender_code"));
            report.setReporter_name(rs.getString("reporter_name"));

            claim.setReport(report);

            return claim;
        }, userId);
    }

    public List<ClaimResponseDTO> getClaimsForReport(int reportId) {
        String sql = "SELECT c.claim_id, c.report_id, c.user_id, c.status, c.admin_remarks, c.claim_code, c.created_at, " +
                     "u.name, " +
                     "r.item_name " +
                     "FROM claims c " +
                     "JOIN users u ON c.user_id = u.user_id " +
                     "JOIN reports r ON c.report_id = r.report_id " +
                     "WHERE c.report_id = ? " +
                     "ORDER BY c.created_at DESC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            ClaimResponseDTO dto = new ClaimResponseDTO();
            dto.setClaim_id(rs.getInt("claim_id"));
            dto.setReport_id(rs.getInt("report_id"));
            dto.setUser_id(rs.getInt("user_id"));

            dto.setUser_name(rs.getString("name"));
            
            dto.setItem_name(rs.getString("item_name"));
            dto.setStatus(rs.getString("status"));
            dto.setAdmin_remarks(rs.getString("admin_remarks"));
            dto.setClaim_code(rs.getString("claim_code"));
            dto.setCreated_at(rs.getString("created_at"));
            return dto;
        }, reportId);
    }

    public List<Claim> getAllClaims() {
        String sql = "SELECT * FROM claims ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, claimMapper);
    }

    public List<Claim> getClaimsByUserId(int userId) {
        String sql = "SELECT * FROM claims WHERE user_id = ? ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, claimMapper, userId);
    }

    public Claim getClaimById(int claimId) {
        try {
            String sql = "SELECT * FROM claims WHERE claim_id = ?";
            return jdbcTemplate.queryForObject(sql, claimMapper, claimId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public String getClaimCode(int userId, int reportId) {
        try {
            String sql = "SELECT claim_code FROM claims WHERE user_id = ? AND report_id = ?";
            return jdbcTemplate.queryForObject(sql, String.class, userId, reportId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public boolean updateClaimStatus(int claimId, String status, String remarks) {
        String sql = "UPDATE claims SET status = ?, admin_remarks = ? WHERE claim_id = ?";
        return jdbcTemplate.update(sql, status, remarks, claimId) > 0;
    }
}