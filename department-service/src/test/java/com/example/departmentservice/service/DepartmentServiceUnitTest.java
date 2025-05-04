package com.example.departmentservice.service;

import com.example.departmentservice.model.Department;
import com.example.departmentservice.repository.DepartmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class DepartmentServiceUnitTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private DepartmentService departmentService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getAllDepartments_returnsAllDepartments() {
        // Arrange
        List<Department> expectedDepartments = Arrays.asList(
                new Department("IT", "Information Technology"),
                new Department("HR", "Human Resources")
        );
        expectedDepartments.get(0).setId(1L);
        expectedDepartments.get(1).setId(2L);
        when(departmentRepository.findAll()).thenReturn(expectedDepartments);

        // Act
        List<Department> actualDepartments = departmentService.getAllDepartments();

        // Assert
        assertEquals(expectedDepartments.size(), actualDepartments.size());
        assertEquals(expectedDepartments.get(0).getName(), actualDepartments.get(0).getName());
        assertEquals(expectedDepartments.get(0).getDescription(), actualDepartments.get(0).getDescription());
        assertEquals(expectedDepartments.get(1).getName(), actualDepartments.get(1).getName());
        assertEquals(expectedDepartments.get(1).getDescription(), actualDepartments.get(1).getDescription());
        verify(departmentRepository, times(1)).findAll();
    }

    @Test
    void getDepartmentById_existingId_returnsDepartment() {
        // Arrange
        Long departmentId = 1L;
        Department expectedDepartment = new Department("IT", "Information Technology");
        expectedDepartment.setId(departmentId);
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.of(expectedDepartment));

        // Act
        Department actualDepartment = departmentService.getDepartmentById(departmentId);

        // Assert
        assertEquals(expectedDepartment.getId(), actualDepartment.getId());
        assertEquals(expectedDepartment.getName(), actualDepartment.getName());
        assertEquals(expectedDepartment.getDescription(), actualDepartment.getDescription());
        verify(departmentRepository, times(1)).findById(departmentId);
    }

    @Test
    void getDepartmentById_nonExistingId_throwsNotFoundException() {
        // Arrange
        Long departmentId = 99L;
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResponseStatusException.class, () -> departmentService.getDepartmentById(departmentId));
        try {
            departmentService.getDepartmentById(departmentId);
        } catch (ResponseStatusException e) {
            assertEquals(HttpStatus.NOT_FOUND, e.getStatusCode());
            assertEquals("Department not found with id: " + departmentId, e.getReason());
        }
        verify(departmentRepository, times(1)).findById(departmentId);
    }

    @Test
    void createDepartment_validDepartment_savesAndReturnsCreatedDepartment() {
        // Arrange
        Department departmentToCreate = new Department("Finance", "Financial Department");
        Department savedDepartment = new Department("Finance", "Financial Department");
        savedDepartment.setId(3L);
        when(departmentRepository.save(any(Department.class))).thenReturn(savedDepartment);

        // Act
        Department actualDepartment = departmentService.createDepartment(departmentToCreate);

        // Assert
        assertEquals(savedDepartment.getId(), actualDepartment.getId());
        assertEquals(savedDepartment.getName(), actualDepartment.getName());
        assertEquals(savedDepartment.getDescription(), actualDepartment.getDescription());
        verify(departmentRepository, times(1)).save(departmentToCreate);
    }
}
