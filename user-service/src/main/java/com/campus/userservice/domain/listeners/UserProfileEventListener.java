package com.campus.userservice.domain.listeners;

import com.campus.userservice.config.RabbitMQConfig;
import com.campus.userservice.domain.events.UserProfileUpdatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class UserProfileEventListener {

    private static final Logger logger = LoggerFactory.getLogger(UserProfileEventListener.class);

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @EventListener
    public void handleUserProfileUpdatedEvent(UserProfileUpdatedEvent event) {
        logger.info("Received UserProfileUpdatedEvent for userId: {}, publishing to RabbitMQ...", event.getUserId());

        try {
            // Convert and send the event object (or a derived DTO) to RabbitMQ
            // Ensure UserProfileUpdatedEvent is serializable (e.g., implements Serializable or use Jackson)
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY_USER_UPDATED,
                    event
            );
            logger.info("UserProfileUpdatedEvent published successfully for userId: {} with routing key '{}'", event.getUserId(), RabbitMQConfig.ROUTING_KEY_USER_UPDATED);
        } catch (Exception e) {
            logger.error("Failed to publish UserProfileUpdatedEvent for userId: {} to RabbitMQ", event.getUserId(), e);
            // Implement error handling/retry logic if needed
        }
    }
} 