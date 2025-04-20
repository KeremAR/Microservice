package com.kampusodak.user_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // To enable @PreAuthorize annotations
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                // Allow access to Swagger UI and API docs without authentication
                .requestMatchers(
                        "/swagger-ui.html",
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/webjars/**" // Often needed for Swagger UI resources
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
            )
            // Disable CSRF protection as it's typically not needed for stateless REST APIs
            .csrf(csrf -> csrf.disable());

        return http.build();
    }

    // Optional: If you need to customize JWT decoding or claims mapping,
    // you can define a JwtDecoder bean or a JwtAuthenticationConverter bean here.
    // For Entra ID defaults, usually not needed initially.

} 