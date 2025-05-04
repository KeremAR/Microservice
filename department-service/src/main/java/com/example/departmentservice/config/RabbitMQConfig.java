package com.example.departmentservice.config;

import com.rabbitmq.client.AMQP;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Configuration;


@Configuration
public class RabbitMQConfig {
    public static final String ISSUE_CREATED_QUEUE = "issue_created";

    public Queue issueCreatedQueue() {
        return new Queue(ISSUE_CREATED_QUEUE , false);
    }
}
