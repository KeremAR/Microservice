package com.example.departmentservice.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class DepartmentIssueId implements Serializable {

    @Column(name = "department_id")
    private Long department_id;

    @Column(name = "issue_id")
    private String issue_id;

    public DepartmentIssueId() {
    }

    public DepartmentIssueId(Long department_id, String issue_id) {
        this.department_id = department_id;
        this.issue_id = issue_id;
    }

    public Long getDepartment_id() {
        return department_id;
    }

    public void setDepartment_id(Long department_id) {
        this.department_id = department_id;
    }

    public String getIssue_id() {
        return issue_id;
    }

    public void setIssue_id(String issue_id) {
        this.issue_id = issue_id;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DepartmentIssueId that = (DepartmentIssueId) o;
        return Objects.equals(department_id, that.department_id) && Objects.equals(issue_id, that.issue_id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(department_id, issue_id);
    }
}