package com.example.departmentservice.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "department_issues")
public class DepartmentIssue {

    @EmbeddedId
    private DepartmentIssueId id;

    private String title;
    private String description;
    private String category;
    private String photo_url;
    private String user_id;
    private Double latitude;
    private Double longitude;
    private String status;
    private LocalDateTime created_at;

    public DepartmentIssueId getId() {
        return id;
    }

    public void setId(DepartmentIssueId id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPhoto_url() {
        return photo_url;
    }

    public void setPhoto_url(String photo_url) {
        this.photo_url = photo_url;
    }

    public String getUser_id() {
        return user_id;
    }

    public void setUser_id(String user_id) {
        this.user_id = user_id;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreated_at() {
        return created_at;
    }

    public void setCreated_at(LocalDateTime created_at) {
        this.created_at = created_at;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DepartmentIssue that = (DepartmentIssue) o;
        return Objects.equals(id, that.id) && Objects.equals(title, that.title) && Objects.equals(description, that.description) && Objects.equals(category, that.category) && Objects.equals(photo_url, that.photo_url) && Objects.equals(user_id, that.user_id) && Objects.equals(latitude, that.latitude) && Objects.equals(longitude, that.longitude) && Objects.equals(status, that.status) && Objects.equals(created_at, that.created_at);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, title, description, category, photo_url, user_id, latitude, longitude, status, created_at);
    }
}