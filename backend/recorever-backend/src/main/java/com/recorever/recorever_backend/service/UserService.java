package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.config.JwtUtil;
import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class UserService {

    @Autowired  
    private UserRepository repo;

    @Autowired
    private JwtUtil jwtUtil;


    public Map<String, Object> register(String name, String email, String password) {
        int result = repo.registerUser(name, email, password);
        if (result == -1) {
            return Map.of("error", "Email already exists");
        }
        return Map.of("user_id", result, "name", name, "email", email);
    }

    public Map<String, Object> login(String email, String password) {
        User user = repo.findByEmail(email);
        if (user != null) {
        System.out.println("Email: " + email);
        System.out.println("Entered password: " + password);
        System.out.println("DB Hash: " + user.getPassword_hash());
        System.out.println("Matches: " + BCrypt.checkpw(password, user.getPassword_hash()));
        }
        if (user == null || !BCrypt.checkpw(password, user.getPassword_hash())) {
            return Map.of("error", "Invalid email or password");
        }

        String accessToken = jwtUtil.generateToken(user.getUser_id(), user.getName());

        String refreshToken = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusDays(7);
        
        repo.saveRefreshToken(user.getUser_id(), refreshToken, expiry);

        return Map.of(
            "access_token", accessToken,
            "token_type", "Bearer",
            "expires_in", 3600,
            "refresh_token", refreshToken,
            "user_id", user.getUser_id(),
            "user_name", user.getName()
        );
    }
}
