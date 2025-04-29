package com.campuscaution.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String auth0Id;
    private String email;
    private String name;
    private String role;
    private String departmentId;
} 