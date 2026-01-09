package com.recorever.recorever_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    @JsonProperty("user_id")
    private int userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    @JsonProperty("password_hash")
    private String passwordHash;

    @Column(nullable = false)
    private String role;

    @Column(name = "profile_picture")
    @JsonProperty("profile_picture")
    private String profilePicture;

    @Column(name = "phone_number")
    @JsonProperty("phone_number")
    private String phoneNumber;
    
    @Column(name = "created_at", updatable = false)
    @JsonProperty("created_at")
    private String createdAt;

    @Column(name = "refresh_token")
    @JsonProperty("refresh_token")
    private String refreshToken;

    @Column(name = "refresh_token_expiry")
    @JsonProperty("refresh_token_expiry")
    private LocalDateTime refreshTokenExpiry;

    @Column(name = "is_deleted", nullable = false)
    @JsonProperty("is_deleted")
    private boolean isDeleted;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String userRole = (this.role == null || this.role.isEmpty()) 
            ? "USER" : this.role.toUpperCase();
        return List.of(new SimpleGrantedAuthority("ROLE_" + userRole));
    }

    @Override
    public String getPassword() {
        return this.passwordHash;
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return !isDeleted; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return !isDeleted; }
}