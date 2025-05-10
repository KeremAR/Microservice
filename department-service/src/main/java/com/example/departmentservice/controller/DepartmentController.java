package com.example.departmentservice.controller;

import com.example.departmentservice.dto.DepartmentDto;
import com.example.departmentservice.model.Department;
import com.example.departmentservice.service.DepartmentIssueService;
import com.example.departmentservice.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/departments")
public class DepartmentController {

    private final DepartmentService departmentService;
    private final DepartmentIssueService departmentIssueService;

    public DepartmentController(DepartmentService departmentService, DepartmentIssueService departmentIssueService) {
        this.departmentService = departmentService;
        this.departmentIssueService = departmentIssueService;
    }

    @GetMapping("/get-all")
    public ResponseEntity<List<Department>> getAllDepartments() {
        List<Department> departments = departmentService.getAllDepartments();
        return new ResponseEntity<>(departments, HttpStatus.OK);
    }

    @PostMapping("/create")
    public ResponseEntity<DepartmentDto> createDepartment(@Valid @RequestBody DepartmentDto departmentDto) {
        Department department = mapToEntity(departmentDto, true);
        Department createdDepartment = departmentService.createDepartment(department);
        return new ResponseEntity<>(mapToDto(createdDepartment), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Department> getDepartmentById(@PathVariable Long id) {
        Department department = departmentService.getDepartmentById(id);
        return new ResponseEntity<>(department, HttpStatus.OK);
    }

    @GetMapping("/{id}/issues")
    public List<String> getDepartmentIssues(@PathVariable Long id) {
        return departmentIssueService.getIssuesForDepartment(id);
    }

    private Department mapToEntity(DepartmentDto departmentDto, boolean isActiveDefault) {
        Department department = new Department();
        department.setName(departmentDto.getName());
        department.setDescription(departmentDto.getDescription());
        department.setActive(isActiveDefault);
        return department;
    }

    private DepartmentDto mapToDto(Department department) {
        DepartmentDto departmentDto = new DepartmentDto();
        departmentDto.setId(department.getId());
        departmentDto.setName(department.getName());
        departmentDto.setDescription(department.getDescription());
        return departmentDto;
    }
}