package com.campus.userservice.domain.listeners;

import com.campus.userservice.domain.events.UserRegisteredEvent;
import com.campus.userservice.domain.events.UserProfileUpdatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class UserEventListener {

    private static final Logger logger = LoggerFactory.getLogger(UserEventListener.class);

    @EventListener
    public void handleUserRegisteredEvent(UserRegisteredEvent event) {
        logger.info("Received UserRegisteredEvent: {}", event);
        // İleride burada başka işlemler yapılabilir (örn: hoşgeldin e-postası gönderme)
    }

    @EventListener
    public void handleUserProfileUpdatedEvent(UserProfileUpdatedEvent event) {
        logger.info("Received UserProfileUpdatedEvent: {}", event);
        // İleride burada başka işlemler yapılabilir (örn: ilgili sistemlere bildirim)
    }
} 