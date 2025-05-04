package com.example.departmentservice.repository;

import com.example.departmentservice.model.DepartmentIssue;
import com.example.departmentservice.model.DepartmentIssueId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DepartmentIssueRepository extends JpaRepository<DepartmentIssue, DepartmentIssueId> {

    List<DepartmentIssue> findById_DepartmentId(Long departmentId);
}
