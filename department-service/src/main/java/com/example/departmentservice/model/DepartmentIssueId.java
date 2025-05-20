package com.example.departmentservice.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class DepartmentIssueId implements Serializable {

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "issue_id")
    private String issueId;

    public DepartmentIssueId() {
    }

    public DepartmentIssueId(Long departmentId, String issueId) {
        this.departmentId = departmentId;
        this.issueId = issueId;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public String getIssueId() {
        return issueId;
    }

    public void setIssueId(String issueId) {
        this.issueId = issueId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DepartmentIssueId that = (DepartmentIssueId) o;
        return Objects.equals(departmentId, that.departmentId) && Objects.equals(issueId, that.issueId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(departmentId, issueId);
    }
}