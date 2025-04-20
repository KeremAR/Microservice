package com.campus.userservice.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UserUpdateRequest {

    // Allow updating first name, optional
    @Size(max = 50, message = "First name cannot exceed 50 characters")
    private String firstName;

    // Allow updating last name, optional
    @Size(max = 50, message = "Last name cannot exceed 50 characters")
    private String lastName;

    // Maybe allow updating email? Requires careful consideration if it should sync back to Entra ID
    // @Email(message = "Invalid email format")
    // @Size(max = 50, message = "Email cannot exceed 50 characters")
    // private String email;

    // Other updatable profile fields can be added here (e.g., phone number, department)
} 