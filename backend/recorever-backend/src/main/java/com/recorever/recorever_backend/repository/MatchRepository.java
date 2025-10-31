package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.Match;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class MatchRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<Match> matchMapper = (rs, rowNum) -> {
        Match m = new Match();
        m.setMatch_id(rs.getInt("match_id"));
        m.setLost_report_id(rs.getInt("lost_report_id"));
        m.setFound_report_id(rs.getInt("found_report_id"));
        m.setStatus(rs.getString("status"));
        m.setCreated_at(rs.getString("created_at"));
        return m;
    };

    public int createMatch(int lostReportId, int foundReportId) {
        String sql = "INSERT INTO matches (lost_report_id, found_report_id, status, created_at) VALUES (?, ?, 'pending', NOW())";
        jdbcTemplate.update(sql, lostReportId, foundReportId);
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
    }

    public List<Match> getAllMatches() {
        String sql = "SELECT * FROM matches ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, matchMapper);
    }

    public Match getMatchById(int id) {
        try {
            String sql = "SELECT * FROM matches WHERE match_id = ?";
            return jdbcTemplate.queryForObject(sql, matchMapper, id);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public boolean updateMatchStatus(int id, String status) {
        String sql = "UPDATE matches SET status=? WHERE match_id=?";
        return jdbcTemplate.update(sql, status, id) > 0;
    }
}