package com.recorever.recorever_backend.dto;

import lombok.Data;

/**
 * Output DTO for sending user data to the client.
 * Only includes non-sensitive, public fields.
 * (Excludes password_hash, refresh_token, etc.)
 */
@Data
public class UserResponseDTO {
    private int user_id;
    private String name;
    private String email;
    private String role;
    private String profile_picture;
    private String phone_number;
    private String created_at;
}