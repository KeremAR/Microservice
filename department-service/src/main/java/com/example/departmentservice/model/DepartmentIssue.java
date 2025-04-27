package com.example.departmentservice.model;

import jakarta.persistence.*;

@Entity
@Table(name = "department_issues")
public class DepartmentIssue {

    @EmbeddedId
    private DepartmentIssueId id;

    public DepartmentIssueId getId() {
        return id;
    }

    public void setId(DepartmentIssueId id) {
        this.id = id;
    }
}
