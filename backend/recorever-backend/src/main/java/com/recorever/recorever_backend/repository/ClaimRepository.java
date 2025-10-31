package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.Claim;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

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
        c.setProof_description(rs.getString("proof_description"));
        c.setItem_name(rs.getString("item_name"));
        c.setStatus(rs.getString("status"));
        c.setCreated_at(rs.getString("created_at"));
        return c;
    };

    public int createClaim(int reportId, int userId, String proofDescription, String itemName) {
        String sql = "INSERT INTO claims (report_id, user_id, proof_description, item_name, status, created_at) " +
                     "VALUES (?, ?, ?, ?, 'pending', NOW())";
        jdbcTemplate.update(sql, reportId, userId, proofDescription, itemName);
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
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

    public boolean updateClaimStatus(int claimId, String status) {
        String sql = "UPDATE claims SET status = ? WHERE claim_id = ?";
        return jdbcTemplate.update(sql, status, claimId) > 0;
    }
}