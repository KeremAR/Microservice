package com.example.departmentservice.service;

import com.example.departmentservice.model.Department;
import com.example.departmentservice.repository.DepartmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department createDepartment(Department department) {

        return departmentRepository.save(department);
    }

    public Department getDepartmentById(Long id) {
        Optional<Department> departmentOptional = departmentRepository.findById(id);
        if (departmentOptional.isPresent()) {
            return departmentOptional.get();
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found with id: " + id);
        }
    }

}
