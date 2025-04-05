package com.campus.userservice.domain.events;

import java.time.LocalDateTime;

public class UserRegisteredEvent {

    private final Long userId;
    private final String username;
    private final String email;
    private final LocalDateTime registeredAt;

    public UserRegisteredEvent(Long userId, String username, String email) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.registeredAt = LocalDateTime.now();
    }

    // Getters
    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt;
    }

    @Override
    public String toString() {
        return "UserRegisteredEvent{" +
               "userId=" + userId +
               ", username='" + username + "'" +
               ", email='" + email + "'" +
               ", registeredAt=" + registeredAt +
               '}';
    }
} 