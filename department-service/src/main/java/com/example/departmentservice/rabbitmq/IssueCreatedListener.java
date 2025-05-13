package com.example.departmentservice.rabbitmq;

import com.example.departmentservice.config.RabbitMQConfig;
import com.example.departmentservice.model.DepartmentIssue;
import com.example.departmentservice.model.DepartmentIssueId;
import com.example.departmentservice.repository.DepartmentIssueRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;

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
            String title = root.path("title").asText();
            String description = root.path("description").asText();
            String category = root.path("category").asText();
            String photoUrl = root.path("photoUrl").asText();
            String userId = root.path("userId").asText();
            Double latitude = root.path("latitude").asDouble();
            Double longitude = root.path("longitude").asDouble();
            String status = root.path("status").asText();
            String createdAtStr = root.path("createdAt").asText();

            LocalDateTime createdAt = null;
            if (createdAtStr != null && !createdAtStr.isEmpty()) {
                OffsetDateTime offsetDateTime = OffsetDateTime.parse(createdAtStr, ISO_OFFSET_DATE_TIME);
                createdAt = offsetDateTime.toLocalDateTime();
            }

            DepartmentIssue departmentIssue = new DepartmentIssue();
            departmentIssue.setId(new DepartmentIssueId(departmentId, issueId));
            departmentIssue.setTitle(title);
            departmentIssue.setDescription(description);
            departmentIssue.setCategory(category);
            departmentIssue.setPhotoUrl(photoUrl);
            departmentIssue.setUserId(userId);
            departmentIssue.setLatitude(latitude);
            departmentIssue.setLongitude(longitude);
            departmentIssue.setStatus(status);
            departmentIssue.setCreatedAt(createdAt);

            departmentIssueRepository.save(departmentIssue);
            System.out.println("Issue kaydedildi: " + issueId + " - Departman: " + departmentId + " - Başlık: " + title);

        } catch (Exception e) {
            System.err.println("Issue Created event işlenirken hata oluştu: " + e.getMessage());
        }
    }
}
