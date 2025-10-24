package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCrypt;

import java.sql.ResultSet;
import java.sql.SQLException;

@Repository
public class UserRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<User> userMapper = new RowMapper<User>() {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
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
            return u;
        }
    };

    public int registerUser(String name, String email, String password) {
        String checkSql = "SELECT COUNT(*) FROM users WHERE email = ?";
        int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, email);
        if (exists > 0) return -1;

        String hashed = BCrypt.hashpw(password, BCrypt.gensalt());
        String sql = "INSERT INTO users (name, email, password_hash, is_deleted) VALUES (?, ?, ?, 0)";
        jdbcTemplate.update(sql, name, email, hashed);

        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
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
}
