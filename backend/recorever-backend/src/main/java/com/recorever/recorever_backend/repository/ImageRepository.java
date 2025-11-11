package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.Image;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;

@Repository
public class ImageRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<Image> imageMapper = new RowMapper<>() {
        @Override
        public Image mapRow(ResultSet rs, int rowNum) throws SQLException {
            Image i = new Image();
            i.setImage_id(rs.getInt("image_id"));
            
            // Handle nullable foreign keys
            int reportId = rs.getInt("report_id");
            i.setReport_id(rs.wasNull() ? null : reportId);
            
            int claimId = rs.getInt("claim_id");
            i.setClaim_id(rs.wasNull() ? null : claimId);
            
            i.setFile_path(rs.getString("file_path"));
            i.setUploaded_at(rs.getString("uploaded_at"));
            i.setIs_deleted(rs.getBoolean("is_deleted"));
            return i;
        }
    };

    public List<Image> getAllImages() {
        String sql = "SELECT * FROM images WHERE is_deleted = 0 ORDER BY uploaded_at DESC";
        return jdbcTemplate.query(sql, imageMapper);
    }

    public Image getImageById(int id) {
        try {
            String sql = "SELECT * FROM images WHERE image_id = ? AND is_deleted = 0";
            return jdbcTemplate.queryForObject(sql, imageMapper, id);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public int saveReportImage(int reportId, String filePath) {
        String sql = "INSERT INTO images (report_id, claim_id, file_path, is_deleted, uploaded_at) VALUES (?, NULL, ?, 0, NOW())";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, reportId);
            ps.setString(2, filePath);
            return ps;
        }, keyHolder);
        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : -1;
    }

    public int saveClaimImage(int claimId, String filePath) {
        String sql = "INSERT INTO images (report_id, claim_id, file_path, is_deleted, uploaded_at) VALUES (NULL, ?, ?, 0, NOW())";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, claimId);
            ps.setString(2, filePath);
            return ps;
        }, keyHolder);
        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : -1;
    }

    public boolean softDeleteImage(int id) {
        String sql = "UPDATE images SET is_deleted = 1 WHERE image_id = ?";
        return jdbcTemplate.update(sql, id) > 0;
    }
}