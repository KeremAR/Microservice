package com.example.departmentservice.rabbitmq;

import com.example.departmentservice.config.RabbitMQConfig;
import com.example.departmentservice.dto.IssueDto;
import com.example.departmentservice.model.DepartmentIssue;
import com.example.departmentservice.model.DepartmentIssueId;
import com.example.departmentservice.repository.DepartmentIssueRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.io.IOException;
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
            IssueDto issueDto = objectMapper.readValue(message, IssueDto.class);

            DepartmentIssue departmentIssue = new DepartmentIssue();
            departmentIssue.setId(new DepartmentIssueId(issueDto.getDepartmentId(), issueDto.getId()));
            departmentIssue.setTitle(issueDto.getTitle());
            departmentIssue.setDescription(issueDto.getDescription());
            departmentIssue.setCategory(issueDto.getCategory());
            departmentIssue.setPhoto_url(issueDto.getPhotoUrl());
            departmentIssue.setUser_id(issueDto.getUserId());
            departmentIssue.setLatitude(issueDto.getLatitude());
            departmentIssue.setLongitude(issueDto.getLongitude());
            departmentIssue.setStatus(issueDto.getStatus());
            departmentIssue.setCreated_at(issueDto.getCreatedAt());

            departmentIssueRepository.save(departmentIssue);

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
