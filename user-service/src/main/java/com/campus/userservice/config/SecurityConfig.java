package com.campus.userservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // Disable CSRF first
            .authorizeHttpRequests(authorize -> authorize
                // Allow access to Swagger UI, API docs and Auth endpoints without authentication
                .requestMatchers(
                        "/swagger-ui.html",
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/webjars/**", // Often needed for Swagger UI resources
                        "/api/auth/**" // Allow access to signup/login
                ).permitAll()
                // Require authentication for all other requests
                .anyRequest().authenticated()
            )
            // Configure OAuth2 Resource Server to validate JWTs
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> {}) // Uses issuer-uri from application.properties by default
            )
            // Configure session management to be stateless, suitable for REST APIs
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Optional: If you need to customize JWT decoding or claims mapping,
    // you can define a JwtDecoder bean or a JwtAuthenticationConverter bean here.
    // For Entra ID defaults, usually not needed initially.

}