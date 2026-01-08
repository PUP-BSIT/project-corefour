package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.config.JwtUtil;
import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.repository.UserRepository;
import com.recorever.recorever_backend.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository repo;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ReportRepository reportRepo;

    private static final int ADMIN_USER_ID = 1;

    public static class ChangePasswordRequest {
        private String oldPassword;
        private String newPassword;

        public String getOldPassword() { return oldPassword; }
        public void setOldPassword(String old) { this.oldPassword = old; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String n) { this.newPassword = n; }
    }

    @Transactional
    public int register(String name, String phone, String email, String pwd) {
        if (repo.findByEmailAndIsDeletedFalse(email).isPresent()) {
            return -1;
        }

        User user = new User();
        user.setName(name);
        user.setPhoneNumber(phone);
        user.setEmail(email);
        user.setPasswordHash(BCrypt.hashpw(pwd, BCrypt.gensalt()));
        user.setRole("user");
        user.setDeleted(false);
        user.setCreatedAt(LocalDateTime.now().toString());

        User savedUser = repo.save(user);
        return savedUser.getUserId();
    }

    public Map<String, Object> login(String email, String password) {
        User user = repo.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid email or password"));

        if (!BCrypt.checkpw(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String accessToken = jwtUtil.generateToken(
                user.getUserId(), user.getName());
        String refreshToken = UUID.randomUUID().toString();
        
        user.setRefreshToken(refreshToken);
        user.setRefreshTokenExpiry(LocalDateTime.now().plusDays(7));
        repo.save(user);

        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "user", user);
    }

    @Transactional
    public Map<String, Object> refreshTokens(User user) {
        String newAT = jwtUtil.generateToken(user.getUserId(), user.getName());
        String newRT = UUID.randomUUID().toString();

        user.setRefreshToken(newRT);
        user.setRefreshTokenExpiry(LocalDateTime.now().plusDays(7));
        repo.save(user);

        return Map.of(
                "accessToken", newAT,
                "refreshToken", newRT,
                "user", user);
    }

    @Transactional
    public Map<String, Object> updateUserProfile(User user, String name, 
            String phone, String email, String profilePicture) {
        int userId = user.getUserId();

        if (name != null && !name.isEmpty() && !name.equals(user.getName())) {
            if (repo.isNameTaken(name, userId)) {
                return Map.of("error", "Username is already taken.");
            }
            user.setName(name);
        }

        if (phone != null && !phone.isEmpty() && 
                !phone.equals(user.getPhoneNumber())) {
            if (repo.isPhoneNumberTaken(phone, userId)) {
                return Map.of("error", "Phone number is already in use.");
            }
            user.setPhoneNumber(phone);
        }

        if (email != null && !email.isEmpty() && 
                !email.equals(user.getEmail())) {
            if (repo.isEmailTaken(email, userId)) {
                return Map.of("error", "Email is already in use.");
            }
            user.setEmail(email);
        }

        if (profilePicture != null && !profilePicture.isEmpty()) {
            user.setProfilePicture(profilePicture);
        }

        repo.save(user);
        return Map.of("success", true);
    }

    @Transactional
    public void changePassword(User user, String oldPwd, String newPwd) {
        if (!BCrypt.checkpw(oldPwd, user.getPasswordHash())) {
            throw new IllegalArgumentException("Incorrect old password");
        }

        String pattern = "^(?=.*[0-9])(?=.*[!@#$%^&*(),.?\":{}|<>]).{8,}$";
        if (!newPwd.matches(pattern)) {
            throw new IllegalArgumentException(
                    "Password requires a number and special character.");
        }

        user.setPasswordHash(BCrypt.hashpw(newPwd, BCrypt.gensalt()));
        repo.save(user);
    }

    public boolean emailExists(String email) {
        return repo.findByEmailAndIsDeletedFalse(email).isPresent();
    }

    @Transactional
    public boolean resetUserPassword(String email, String newPassword) {
        return repo.findByEmailAndIsDeletedFalse(email).map(user -> {
            user.setPasswordHash(BCrypt.hashpw(newPassword, BCrypt.gensalt()));
            repo.save(user);
            return true;
        }).orElse(false);
    }

    @Transactional
    public void deleteAccount(int userId) {
        repo.softDeleteUser(userId);        
        reportRepo.softDeleteLostReportsByUserId(userId);
        reportRepo.transferFoundReportsToAdmin(userId, ADMIN_USER_ID);
    }
}