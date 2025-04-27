package com.example.departmentservice.rabbitmq;

import com.example.departmentservice.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class IssueCreatedListener {

    @RabbitListener(queues = RabbitMQConfig.ISSUE_CREATED_QUEUE)
    public void receiveIssueCreatedEvent(String message) {
        System.out.println("Department Service received Issue Created event: " + message);
    }
}
