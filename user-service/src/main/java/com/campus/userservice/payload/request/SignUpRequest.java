package com.campus.userservice.payload.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SignUpRequest {

    @NotBlank
    @Size(min = 2, max = 50)
    private String firstName;

    @NotBlank
    @Size(min = 2, max = 50)
    private String lastName;

    @NotBlank
    @Size(max = 50)
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, max = 120) // Example password length constraints
    private String password;
} 