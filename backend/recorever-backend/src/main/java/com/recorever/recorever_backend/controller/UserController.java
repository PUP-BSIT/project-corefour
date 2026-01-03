package com.recorever.recorever_backend.controller;

// Service & Repository Imports
import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.service.ImageService;
import com.recorever.recorever_backend.service.UserService;
import com.recorever.recorever_backend.service.UserService.ChangePasswordRequest;
import com.recorever.recorever_backend.repository.UserRepository;

// DTO Imports
import com.recorever.recorever_backend.dto.UserRegistrationDTO; 
import com.recorever.recorever_backend.dto.UserLoginDTO;    
import com.recorever.recorever_backend.dto.UserResponseDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    private final ImageService imageService;

    @Autowired
    private UserService service;

    @Autowired
    private UserRepository repo;

    UserController(ImageService imageService) {
        this.imageService = imageService;
    }

    /* This prevents exposing internal database or security fields.*/
    private UserResponseDTO mapToUserResponseDTO(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setUser_id(user.getUser_id());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setProfile_picture(user.getProfile_picture());
        dto.setPhone_number(user.getPhone_number());
        dto.setCreated_at(user.getCreated_at());
        return dto;
    }

    @PostMapping("/register-user")
    public ResponseEntity<?> registerUser(@Valid @RequestBody
                                        UserRegistrationDTO registrationDto) {
        int userId = service.register(
            registrationDto.getName(), 
            registrationDto.getPhone_number(),
            registrationDto.getEmail(),
            registrationDto.getPassword()
        );
        
        if (userId == -1) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Email already exists"));
        }

        User newUser = repo.findById(userId);
        UserResponseDTO responseDto = mapToUserResponseDTO(newUser);

        return ResponseEntity.status(201).body(responseDto);
    }

    @PostMapping("/login-user")
    public ResponseEntity<?> loginUser(
        @Valid @RequestBody UserLoginDTO loginDto, 
        HttpServletResponse response
    ) {
        
        String email = loginDto.getEmail();
        String password = loginDto.getPassword();

        try {
            Map<String, Object> result = service.login(email, password);

            String accessToken = (String) result.get("accessToken");
            String refreshToken = (String) result.get("refreshToken");
            User user = (User) result.get("user");

            // Create HTTP-ONLY Access Token Cookie
            ResponseCookie accessTokenCookie =
                    ResponseCookie.from("accessToken", accessToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(3600) // 1 hour 
                .build();
            response.addHeader(HttpHeaders.SET_COOKIE,
                accessTokenCookie.toString());

            // Create HTTP-ONLY Refresh Token Cookie
            ResponseCookie refreshTokenCookie =
                    ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/api/refresh-token")
                .maxAge(7 * 24 * 3600) // 7 days
                .build();
            response.addHeader
                (HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());

            UserResponseDTO userDto = mapToUserResponseDTO(user);

            return ResponseEntity.ok(userDto); 

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    
    @GetMapping("/get-user-data")
    public ResponseEntity<UserResponseDTO>
            getUser(Authentication authentication) {
        User authenticatedUser = (User) authentication.getPrincipal();
        UserResponseDTO responseDto = mapToUserResponseDTO(authenticatedUser);
        return ResponseEntity.ok(responseDto);
    }

        @GetMapping("/user/{id}")
    public ResponseEntity<?> getUserById(@PathVariable int id) {
        User user = repo.findById(id);
        if (user == null) {
            return ResponseEntity.status(404)
                .body(Map.of("error", "User not found"));
        }
        UserResponseDTO responseDto = mapToUserResponseDTO(user);
        return ResponseEntity.ok(responseDto);
    }

    @GetMapping("/check-unique")
    public ResponseEntity<Map<String, Boolean>> checkUnique(
        Authentication authentication,
        @RequestParam String field,
        @RequestParam String value
    ) {
        User user = (User) authentication.getPrincipal();
        int userId = user.getUser_id();
        boolean isUnique = true;

        if ("email".equals(field)) {
            isUnique = !repo.isEmailTaken(value, userId);
        } else if ("phone_number".equals(field)) {
            isUnique = !repo.isPhoneNumberTaken(value, userId);
        } else if ("name".equals(field)) {
            isUnique = !repo.isNameTaken(value, userId);
        }

        return ResponseEntity.ok(Map.of("isUnique", isUnique));
    }

    @PutMapping("/update-user-data")
    public ResponseEntity<?> 
        updateUser(Authentication authentication,
        @RequestParam(required = false) String name,
        @RequestParam(required = false) String phone_number,
        @RequestParam(required = false) String email,
        @RequestParam(required = false) MultipartFile profile_picture_file) {

        User user = (User) authentication.getPrincipal();
        String profilePictureFilename = user.getProfile_picture();

        if (profile_picture_file != null && !profile_picture_file.isEmpty()) {
            if (user.getProfile_picture() != null) {
                imageService.deleteFile(user.getProfile_picture());
            }
            profilePictureFilename = imageService.storeFile(
                profile_picture_file);
        }
        
        Map<String, Object> result = service
            .updateUserProfile(
                user,
                name,
                phone_number,
                email,
                profilePictureFilename);

        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }

        User updatedUser = repo.findById(user.getUser_id());
        UserResponseDTO responseDto = mapToUserResponseDTO(updatedUser);
        
        return ResponseEntity.ok(responseDto);
    }

    @DeleteMapping("/delete-user")
    public ResponseEntity<?> deleteUser(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        int userId = user.getUser_id();

        boolean deleted = repo.deleteUser(userId);
        if (!deleted)
            return ResponseEntity.status(404)
                .body("User not found or already deleted.");
        
        return ResponseEntity.ok(Map.of("success", true, "message", 
                                            "User account deactivated "));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
        Authentication authentication,
        @RequestBody ChangePasswordRequest request
    ) {
        User user = (User) authentication.getPrincipal();
        try {
            service.changePassword(user, request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok(
                Map.of("success",
                    true,
                    "message",
                    "Password changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
        @RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (service.emailExists(email)) {
            return ResponseEntity.ok(
                Map.of("success",
                true,
                "message",
                "Email verified."));
        }
        return ResponseEntity.status(404)
            .body(Map.of("error", "Email not found."));
    }

    // Endpoint para i-update ang password nang walang 'oldPassword'
    @PutMapping("/reset-password-public")
    public ResponseEntity<?> resetPasswordPublic(
        @RequestBody Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");

        if (service.resetUserPassword(email, newPassword)) {
            return ResponseEntity.ok(
                Map.of("success",
                    true,
                    "message",
                    "Password has been reset."));
        }
        return ResponseEntity.status(400).body(
            Map.of("error", "Failed to reset password."));
    }

    @DeleteMapping("/delete-account")
    public ResponseEntity<?> deleteAccount(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        service.deleteAccount(user.getUser_id());
        return ResponseEntity.ok(
            Map.of("success",
                true,
                "message",
                "Account deleted successfully"));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refresh(
        @CookieValue(name = "refreshToken",
            required = false) String oldRefreshToken, 
        HttpServletResponse response 
    ) {
        if (oldRefreshToken == null || oldRefreshToken.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error_message", 
                                        "Refresh token cookie is missing"));
        }

        User user = repo.findByRefreshToken(oldRefreshToken);

        if (user == null || user.getRefresh_token_expiry()
                .isBefore(LocalDateTime.now())) {
            clearCookie(response, "refreshToken");
            return ResponseEntity.status(401).body(Map.of("error_message",
                                    "Invalid or expired refresh token"));
        }
        
        // Call the service to get new tokens
        Map<String, Object> newTokens = service.refreshTokens(user);
        
        String newAccessToken = (String) newTokens.get("accessToken");
        String newRefreshToken = (String) newTokens.get("refreshToken");
        
        // Set new Access Token Cookie
        ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", newAccessToken)
            .httpOnly(true)
            .secure(true) 
            .path("/")
            .maxAge(3600) // 1 hour
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());
        
        // Set new Refresh Token Cookie
        ResponseCookie refreshTokenCookie =
            ResponseCookie.from("refreshToken", newRefreshToken)
                .httpOnly(true)
                .secure(true) 
                .path("/api/refresh-token") 
                .maxAge(7 * 24 * 3600) // 7 days
                .build();
            response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());

            UserResponseDTO userDto = mapToUserResponseDTO(user);
            return ResponseEntity.ok(userDto); 
    }

    private void clearCookie(HttpServletResponse response, String cookieName) {
        ResponseCookie clearedCookie = ResponseCookie.from(cookieName, "")
            .httpOnly(true)
            .secure(true)
            .path("/")
            .maxAge(0)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, clearedCookie.toString());
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        clearCookie(response, "accessToken");
        clearCookie(response, "refreshToken");
        return ResponseEntity.ok(Map.of("success", true, "message",
                                        "Logged out successfully."));
    }
}