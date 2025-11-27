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

    public int register(String name, String phoneNumber, String email, String password) {
        int result = repo.registerUser(name, phoneNumber, email, password);
        return result;
    }

    public Map<String, Object> login(String email, String password) {
        User user = repo.findByEmail(email);

        if (user == null || !BCrypt.checkpw(password, user.getPassword_hash())) {
            throw new IllegalArgumentException("Invalid email or password"); 
        }

        String accessToken = jwtUtil.generateToken(user.getUser_id(), user.getName());

        String refreshToken = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusDays(7); // 7 days

        repo.saveRefreshToken(user.getUser_id(), refreshToken, expiry);

        return Map.of(
            "accessToken", accessToken, 
            "refreshToken", refreshToken, 
            "user", user
        );
    }

    public Map<String, Object> refreshTokens(User user) {
        String newAccessToken = jwtUtil.generateToken(user.getUser_id(), user.getName());

        String newRefreshToken = UUID.randomUUID().toString();
        LocalDateTime newExpiry = LocalDateTime.now().plusDays(7); // 7 days

        repo.saveRefreshToken(user.getUser_id(), newRefreshToken, newExpiry); 

        return Map.of(
            "accessToken", newAccessToken,
            "refreshToken", newRefreshToken,
            "user", user
        );
    }

    public Map<String, Object> updateUserProfile(User user, String name, String phoneNumber, String email, String profilePicture) {
        
        int userId = user.getUser_id();

        if (name != null && !name.isEmpty() && !name.equals(user.getName())) {
            if (repo.isNameTaken(name, userId)) {
                return Map.of("error", "Username is already taken.");
            }
            user.setName(name);
        }

        if (phoneNumber != null && !phoneNumber.isEmpty() && !phoneNumber.equals(user.getPhone_number())) {
            if (repo.isPhoneNumberTaken(phoneNumber, userId)) {
                return Map.of("error", "Phone number is already in use by another account.");
            }
            user.setPhone_number(phoneNumber);
        }

        if (email != null && !email.isEmpty() && !email.equals(user.getEmail())) {
            if (repo.isEmailTaken(email, userId)) {
                return Map.of("error", "Email is already in use by another account.");
            }
            user.setEmail(email);
        }

        if (profilePicture != null && !profilePicture.isEmpty()) {
            user.setProfile_picture(profilePicture);
        }

        boolean updated = repo.updateUser(
            user.getUser_id(), 
            user.getName(), 
            user.getPhone_number(), 
            user.getEmail(),
            user.getProfile_picture()
        );

        if (!updated) {
             return Map.of("error", "Failed to update user.");
        }

        return Map.of("success", true);
    }
}