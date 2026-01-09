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
import java.util.List;
import java.util.stream.Collectors;

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

    /* This prevents exposing internal database or security fields.
    */
    private UserResponseDTO mapToUserResponseDTO(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setUser_id(user.getUserId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setProfile_picture(user.getProfilePicture());
        dto.setPhone_number(user.getPhoneNumber());
        dto.setCreated_at(user.getCreatedAt());
        return dto;
    }

    @PostMapping("/register-user")
    public ResponseEntity<?> registerUser(
            @Valid @RequestBody UserRegistrationDTO registrationDto) {
        try {
            int userId = service.register(
                    registrationDto.getName(),
                    registrationDto.getPhone_number(),
                    registrationDto.getEmail(),
                    registrationDto.getPassword()
            );

            User newUser = repo.findByIdAndIsDeletedFalse(userId)
                    .orElseThrow(() -> new RuntimeException(
                            "User not found after registration"));

            UserResponseDTO responseDto = mapToUserResponseDTO(newUser);
            return ResponseEntity.status(201).body(responseDto);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "An unexpected error occurred."
            ));
        }
    }

    @PostMapping("/login-user")
    public ResponseEntity<?> loginUser(
            @Valid @RequestBody UserLoginDTO loginDto,
            HttpServletResponse response) {
        String email = loginDto.getEmail();
        String password = loginDto.getPassword();

        try {
            Map<String, Object> result = service.login(email, password);

            String accessToken = (String) result.get("accessToken");
            String refreshToken = (String) result.get("refreshToken");
            User user = (User) result.get("user");

            ResponseCookie accessTokenCookie = ResponseCookie
                    .from("accessToken", accessToken)
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .maxAge(3600)
                    .build();
            response.addHeader(
                    HttpHeaders.SET_COOKIE, 
                    accessTokenCookie.toString()
            );

            ResponseCookie refreshTokenCookie = ResponseCookie
                    .from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(true)
                    .path("/api/refresh-token")
                    .maxAge(7 * 24 * 3600)
                    .build();
            response.addHeader(
                    HttpHeaders.SET_COOKIE, 
                    refreshTokenCookie.toString()
            );

            UserResponseDTO userDto = mapToUserResponseDTO(user);
            return ResponseEntity.ok(userDto);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/get-user-data")
    public ResponseEntity<UserResponseDTO> getUser(
            Authentication authentication) {
        User authenticatedUser = (User) authentication.getPrincipal();
        UserResponseDTO responseDto = 
                mapToUserResponseDTO(authenticatedUser);
        return ResponseEntity.ok(responseDto);
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<?> getUserById(@PathVariable int id) {
        return repo.findByIdAndIsDeletedFalse(id)
                .map(u -> ResponseEntity.ok(mapToUserResponseDTO(u)))
                .orElse(ResponseEntity.status(404)
                .body((UserResponseDTO) null)); 
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<UserResponseDTO>> searchUsers(
            @RequestParam String query) {
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }

        List<User> users = repo.searchUsers(query);

        List<UserResponseDTO> userDTOs = users.stream()
                .map(this::mapToUserResponseDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(userDTOs);
    }

    @GetMapping("/check-unique")
    public ResponseEntity<Map<String, Boolean>> checkUnique(
            Authentication authentication,
            @RequestParam String field,
            @RequestParam String value) {
        
        int userId = 0;

        if (authentication != null && authentication.isAuthenticated() && 
            !"anonymousUser".equals(authentication.getPrincipal())) {
            User user = (User) authentication.getPrincipal();
            userId = user.getUserId();
        }

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
    public ResponseEntity<?> updateUser(
            Authentication authentication,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone_number,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) MultipartFile profile_picture_file) {

        User user = (User) authentication.getPrincipal();
        String profilePictureFilename = user.getProfilePicture();

        if (profile_picture_file != null && !profile_picture_file.isEmpty()) {
            if (user.getProfilePicture() != null) {
                imageService.deleteFile(user.getProfilePicture());
            }
            profilePictureFilename = imageService
                    .storeFile(profile_picture_file);
        }

        Map<String, Object> result = service.updateUserProfile(
                user, name, phone_number, email, profilePictureFilename
        );

        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }

        User updatedUser = repo.findByIdAndIsDeletedFalse(user.getUserId())
                .orElseThrow(() -> new RuntimeException(
                        "User not found after update"));
        
        UserResponseDTO responseDto = mapToUserResponseDTO(updatedUser);
        return ResponseEntity.ok(responseDto);
    }

    @DeleteMapping("/delete-user")
    public ResponseEntity<?> deleteUser(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        int userId = user.getUserId();

        int rowsUpdated = repo.softDeleteUser(userId);
        if (rowsUpdated == 0) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "User not found"));
        }

        return ResponseEntity.ok(Map.of(
                "success", true, 
                "message", "User account deactivated "
        ));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest request) {
        User user = (User) authentication.getPrincipal();
        try {
            service.changePassword(
                    user, 
                    request.getOldPassword(), 
                    request.getNewPassword()
            );
            return ResponseEntity.ok(Map.of(
                    "success", true, 
                    "message", "Password changed successfully"
            ));
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
            return ResponseEntity.ok(Map.of(
                    "success", true, 
                    "message", "Email verified."
            ));
        }
        return ResponseEntity.status(404)
                .body(Map.of("error", "Email not found."));
    }

    @PutMapping("/reset-password-public")
    public ResponseEntity<?> resetPasswordPublic(
            @RequestBody Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");

        if (service.resetUserPassword(email, newPassword)) {
            return ResponseEntity.ok(Map.of(
                    "success", true, 
                    "message", "Password has been reset."
            ));
        }
        return ResponseEntity.status(400).body(
                Map.of("error", "Failed to reset password."));
    }

    @DeleteMapping("/delete-account")
    public ResponseEntity<?> deleteAccount(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        service.deleteAccount(user.getUserId());
        return ResponseEntity.ok(Map.of(
                "success", true, 
                "message", "Account deleted successfully"
        ));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false) 
            String oldRefreshToken,
            HttpServletResponse response) {
        if (oldRefreshToken == null || oldRefreshToken.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of(
                    "error_message", "Refresh token cookie is missing"
            ));
        }

        User user = repo.findByRefreshTokenAndIsDeletedFalse(oldRefreshToken)
                .orElse(null);

        if (user == null || user.getRefreshTokenExpiry()
                .isBefore(LocalDateTime.now())) {
            clearCookie(response, "refreshToken", "/api/refresh-token");
            return ResponseEntity.status(401).body(Map.of(
                    "error_message", "Invalid or expired refresh token"
            ));
        }

        Map<String, Object> newTokens = service.refreshTokens(user);
        String accessToken = (String) newTokens.get("accessToken");
        String refreshToken = (String) newTokens.get("refreshToken");

        ResponseCookie accessTokenCookie = ResponseCookie
                .from("accessToken", accessToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(3600)
                .build();
        response.addHeader(
                HttpHeaders.SET_COOKIE, 
                accessTokenCookie.toString()
        );

        ResponseCookie refreshTokenCookie = ResponseCookie
                .from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/api/refresh-token")
                .maxAge(7 * 24 * 3600)
                .build();
        response.addHeader(
                HttpHeaders.SET_COOKIE, 
                refreshTokenCookie.toString()
        );

        UserResponseDTO userDto = mapToUserResponseDTO(user);
        return ResponseEntity.ok(userDto);
    }

    private void clearCookie(
            HttpServletResponse response, 
            String cookieName, 
            String path) {
        ResponseCookie clearedCookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(true)
                .path(path)
                .maxAge(0)
                .sameSite("None")
                .build();
        response.addHeader(
                HttpHeaders.SET_COOKIE, 
                clearedCookie.toString()
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        clearCookie(response, "accessToken", "/");
        clearCookie(response, "refreshToken", "/api/refresh-token");
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Logged out successfully."
        ));
    }
}