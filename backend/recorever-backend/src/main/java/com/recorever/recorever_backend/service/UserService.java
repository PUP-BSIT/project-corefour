package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    @Autowired
    private UserRepository repo;

    public Map<String, Object> register(String name, String email, String password) {
        int result = repo.registerUser(name, email, password);
        if (result == -1) {
            return Map.of("error", "Email already exists");
        }
        return Map.of("user_id", result, "name", name, "email", email);
    }

    public Map<String, Object> login(String email, String password) {
        User user = repo.findByEmail(email);
        if (user == null || !BCrypt.checkpw(password, user.getPassword_hash())) {
            return Map.of("error", "Invalid email or password");
        }
        String token = "abc123xyz456"; // mock token for now
        Map<String, Object> response = new HashMap<>();
        response.put("access_token", token);
        response.put("token_type", "Bearer");
        response.put("expires_in", 3600);
        response.put("user_id", user.getUser_id());
        response.put("user_name", user.getName());
        return response;
    }
}