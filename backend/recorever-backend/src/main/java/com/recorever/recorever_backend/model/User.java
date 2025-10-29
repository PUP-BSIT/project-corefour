package com.recorever.recorever_backend.model;

import java.time.LocalDateTime;
public class User {
    private int user_id;
    private String name;
    private String email;
    private String password_hash;
    private String role;
    private String profile_picture;
    private String phone_number;
    private String created_at;
    private String refresh_token;
    private LocalDateTime refresh_token_expiry;
    private boolean is_deleted;

    // Getters and Setters
    public int getUser_id() { return user_id; }
    public void setUser_id(int user_id) { this.user_id = user_id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword_hash() { return password_hash; }
    public void setPassword_hash(String password_hash) { this.password_hash = password_hash; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getProfile_picture() { return profile_picture; }
    public void setProfile_picture(String profile_picture) { this.profile_picture = profile_picture; }

    public String getPhone_number() { return phone_number; }
    public void setPhone_number(String phone_number) { this.phone_number = phone_number; }

    public String getCreated_at() { return created_at; }
    public void setCreated_at(String created_at) { this.created_at = created_at; }

    public boolean getIs_deleted() { return is_deleted; }
    public void setIs_deleted(boolean is_deleted) { this.is_deleted = is_deleted; }

    public String getRefresh_token() { return refresh_token; }
    public void setRefresh_token(String refresh_token) { this.refresh_token = refresh_token; }

    public LocalDateTime getRefresh_token_expiry() { return refresh_token_expiry; }
    public void setRefresh_token_expiry(LocalDateTime refresh_token_expiry) { this.refresh_token_expiry = refresh_token_expiry; }
}
