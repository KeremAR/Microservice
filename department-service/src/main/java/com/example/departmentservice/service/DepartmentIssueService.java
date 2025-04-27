package com.example.departmentservice.service;

import com.example.departmentservice.model.DepartmentIssue;
import com.example.departmentservice.repository.DepartmentIssueRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepartmentIssueService {

    private final DepartmentIssueRepository departmentIssueRepository;

    public DepartmentIssueService(DepartmentIssueRepository departmentIssueRepository) {
        this.departmentIssueRepository = departmentIssueRepository;
    }

    public List<String> getIssuesForDepartment(Long departmentId) {
        List<DepartmentIssue> departmentIssues = departmentIssueRepository.findById_DepartmentId(departmentId);
        return departmentIssues.stream()
                .map(departmentIssue -> departmentIssue.getId().getIssueId())
                .collect(Collectors.toList());
    }
}
