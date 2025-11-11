package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.config.JwtUtil;
import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.service.UserService;
import com.recorever.recorever_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserService service;

    @Autowired
    private UserRepository repo;

    @Autowired
    private JwtUtil jwtUtil;


    @PostMapping("/register-user")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String phoneNumber = body.get("phone_number");
        String email = body.get("email");
        String password = body.get("password");

        Map<String, Object> result = service.register(name, phoneNumber, email, password);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result.get("error"));
        }
        return ResponseEntity.status(201).body(result);
    }

    @PostMapping("/login-user")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        Map<String, Object> result = service.login(email, password);

        if (result.containsKey("error")) {
            return ResponseEntity.status(401).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/get-user-data")
    public ResponseEntity<?> getUser(Authentication authentication) {
        User authenticatedUser = (User) authentication.getPrincipal();
        
        return ResponseEntity.ok(authenticatedUser);
    }

    @PutMapping("/update-user-data")
    public ResponseEntity<?> updateUser(Authentication authentication,
                                        @RequestParam(required = false) String name,
                                        @RequestParam(required = false) String phone_number,
                                        @RequestParam(required = false) String profile_picture) {
        
        User user = (User) authentication.getPrincipal();

        if (name != null && !name.isEmpty()) {
            user.setName(name);
        }
        if (phone_number != null && !phone_number.isEmpty()) {
            user.setPhone_number(phone_number);
        }
        if (profile_picture != null && !profile_picture.isEmpty()) {
            user.setProfile_picture(profile_picture);
        }

        boolean updated = repo.updateUser(user.getUser_id(), user.getName(), user.getPhone_number(), user.getProfile_picture());
        if (!updated) {
            return ResponseEntity.badRequest().body("Failed to update user.");
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Profile updated successfully."));
    }

    @DeleteMapping("/delete-user")
    public ResponseEntity<?> deleteUser(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        int userId = user.getUser_id();

        boolean deleted = repo.deleteUser(userId);
        if (!deleted)
            return ResponseEntity.status(404).body("User not found or already deleted.");
        
        return ResponseEntity.ok(Map.of("success", true, "message", "User account deactivated."));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");

        User user = repo.findByRefreshToken(refreshToken);
        if (user == null || user.getRefresh_token_expiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(401).body(Map.of("error_message", "Invalid or expired refresh token"));
        }

        String accessToken = jwtUtil.generateToken(user.getUser_id(), user.getName());

        return ResponseEntity.ok(Map.of(
            "access_token", accessToken,
            "token_type", "Bearer",
            "expires_in", 3600,
            "user_id", user.getUser_id(),
            "user_name", user.getName()
        ));
    }
}
