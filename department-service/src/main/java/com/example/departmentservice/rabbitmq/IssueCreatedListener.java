package com.example.departmentservice.rabbitmq;

import com.example.departmentservice.config.RabbitMQConfig;
import com.example.departmentservice.model.DepartmentIssue;
import com.example.departmentservice.model.DepartmentIssueId;
import com.example.departmentservice.repository.DepartmentIssueRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class IssueCreatedListener {

    private final DepartmentIssueRepository departmentIssueRepository;
    private final ObjectMapper objectMapper;

    public IssueCreatedListener(DepartmentIssueRepository departmentIssueRepository, ObjectMapper objectMapper) {
        this.departmentIssueRepository = departmentIssueRepository;
        this.objectMapper = objectMapper;
    }

    @RabbitListener(queues = RabbitMQConfig.ISSUE_CREATED_QUEUE)
    public void receiveIssueCreatedEvent(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            Long departmentId = root.path("departmentId").asLong();
            String issueId = root.path("issueId").asText();

            DepartmentIssue departmentIssue = new DepartmentIssue();
            departmentIssue.setId(new DepartmentIssueId(departmentId, issueId));

            departmentIssueRepository.save(departmentIssue);
            System.out.println("Issue kaydedildi: " + issueId + " - Departman: " + departmentId);

        } catch (Exception e) {
            System.err.println("Issue Created event işlenirken hata oluştu: " + e.getMessage());
        }
    }
}
