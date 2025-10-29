package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCrypt;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;

@Repository
public class UserRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<User> userMapper = (rs, rowNum) -> {
        User u = new User();
        u.setUser_id(rs.getInt("user_id"));
        u.setName(rs.getString("name"));
        u.setEmail(rs.getString("email"));
        u.setPassword_hash(rs.getString("password_hash"));
        u.setRole(rs.getString("role"));
        u.setProfile_picture(rs.getString("profile_picture"));
        u.setPhone_number(rs.getString("phone_number"));
        u.setCreated_at(rs.getString("created_at"));
        u.setIs_deleted(rs.getBoolean("is_deleted"));
        u.setRefresh_token(rs.getString("refresh_token"));

        if (rs.getTimestamp("refresh_token_expiry") != null) {
            u.setRefresh_token_expiry(rs.getTimestamp("refresh_token_expiry").toLocalDateTime());
        }
        return u;
    };
    
    public int registerUser(String name, String email, String password) {
        String checkSql = "SELECT COUNT(*) FROM users WHERE email = ?";
        int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, email);
        if (exists > 0) return -1;

        String hashed = BCrypt.hashpw(password, BCrypt.gensalt());
        String sql = "INSERT INTO users (name, email, password_hash, is_deleted) VALUES (?, ?, ?, 0)";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, name);
            ps.setString(2, email);
            ps.setString(3, hashed);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        return key != null ? key.intValue() : -1;
    }
    
    public User findByEmail(String email) {
        try {
            String sql = "SELECT * FROM users WHERE email = ? AND is_deleted = 0";
            return jdbcTemplate.queryForObject(sql, userMapper, email);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public User findById(int id) {
        try {
            String sql = "SELECT * FROM users WHERE user_id = ? AND is_deleted = 0";
            return jdbcTemplate.queryForObject(sql, userMapper, id);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public boolean updateUser(int id, String name, String phone, String picture) {
        String sql = "UPDATE users SET name=?, phone_number=?, profile_picture=? WHERE user_id=? AND is_deleted = 0";
        return jdbcTemplate.update(sql, name, phone, picture, id) > 0;
    }

    public boolean deleteUser(int id) {
        String sql = "UPDATE users SET is_deleted = 1 WHERE user_id=? AND is_deleted = 0";
        return jdbcTemplate.update(sql, id) > 0;
    }

    public boolean saveRefreshToken(int userId, String token, LocalDateTime expiry) {
        String sql = "UPDATE users SET refresh_token = ?, refresh_token_expiry = ? WHERE user_id = ?";
        Timestamp expiryTs = expiry != null ? Timestamp.valueOf(expiry) : null;
        int rows = jdbcTemplate.update(sql, token, expiryTs, userId);
        return rows > 0;
    }

    public User findByRefreshToken(String token) {
        try {
            String sql = "SELECT * FROM users WHERE refresh_token = ? AND is_deleted = 0";
            return jdbcTemplate.queryForObject(sql, userMapper, token);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }
}
