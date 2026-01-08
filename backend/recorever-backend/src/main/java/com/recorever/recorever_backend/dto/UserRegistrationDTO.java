package com.recorever.recorever_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Input DTO for user registration.
 * Used for receiving input data and applying validation rules.
 */
@Data 
public class UserRegistrationDTO {

    @NotBlank(message = "Name is required")
    @Pattern(regexp = "^\\S+$", message = "Username cannot contain spaces")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    @NotBlank(message = "Phone number is required")
    private String phone_number;
}