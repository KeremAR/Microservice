package com.campus.userservice.payload.response;

import lombok.Data;
import java.util.List;

@Data // Lombok will generate getters, setters, constructor, etc.
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String email;
    private List<String> roles;

    public JwtResponse(String accessToken, Long id, String email, List<String> roles) {
        this.token = accessToken;
        this.id = id;
        this.email = email;
        this.roles = roles;
    }
} 