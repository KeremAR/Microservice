package com.campus.userservice.domain.events;

import java.time.LocalDateTime;

public class UserProfileUpdatedEvent {

    private final Long userId;
    private final String oldEmail; // Örnek olarak eski e-postayı da tutabiliriz
    private final String newEmail;
    private final LocalDateTime updatedAt;

    public UserProfileUpdatedEvent(Long userId, String oldEmail, String newEmail) {
        this.userId = userId;
        this.oldEmail = oldEmail;
        this.newEmail = newEmail;
        this.updatedAt = LocalDateTime.now();
    }

    // Getters
    public Long getUserId() {
        return userId;
    }

    public String getOldEmail() {
        return oldEmail;
    }

    public String getNewEmail() {
        return newEmail;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public String toString() {
        return "UserProfileUpdatedEvent{" +
               "userId=" + userId +
               ", oldEmail='" + oldEmail + "'" +
               ", newEmail='" + newEmail + "'" +
               ", updatedAt=" + updatedAt +
               '}';
    }
} 