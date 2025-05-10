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

import java.time.LocalDateTime;
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
    void getAllDepartments_returnsAllDepartmentsWithNewFields() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        List<Department> expectedDepartments = Arrays.asList(
                new Department("IT", "Information Technology", true),
                new Department("HR", "Human Resources", false)
        );
        expectedDepartments.get(0).setId(1L);
        expectedDepartments.get(0).setCreatedAt(now);
        expectedDepartments.get(0).setUpdatedAt(now);
        expectedDepartments.get(1).setId(2L);
        expectedDepartments.get(1).setCreatedAt(now.minusDays(1));
        expectedDepartments.get(1).setUpdatedAt(now.minusDays(1));
        when(departmentRepository.findAll()).thenReturn(expectedDepartments);

        // Act
        List<Department> actualDepartments = departmentService.getAllDepartments();

        // Assert
        assertEquals(expectedDepartments.size(), actualDepartments.size());
        assertEquals(expectedDepartments.get(0).getName(), actualDepartments.get(0).getName());
        assertEquals(expectedDepartments.get(0).getDescription(), actualDepartments.get(0).getDescription());
        assertEquals(expectedDepartments.get(0).getActive(), actualDepartments.get(0).getActive());
        assertEquals(expectedDepartments.get(0).getCreatedAt(), actualDepartments.get(0).getCreatedAt());
        assertEquals(expectedDepartments.get(0).getUpdatedAt(), actualDepartments.get(0).getUpdatedAt());

        assertEquals(expectedDepartments.get(1).getName(), actualDepartments.get(1).getName());
        assertEquals(expectedDepartments.get(1).getDescription(), actualDepartments.get(1).getDescription());
        assertEquals(expectedDepartments.get(1).getActive(), actualDepartments.get(1).getActive());
        assertEquals(expectedDepartments.get(1).getCreatedAt(), actualDepartments.get(1).getCreatedAt());
        assertEquals(expectedDepartments.get(1).getUpdatedAt(), actualDepartments.get(1).getUpdatedAt());
        verify(departmentRepository, times(1)).findAll();
    }

    @Test
    void getDepartmentById_existingId_returnsDepartmentWithNewFields() {
        // Arrange
        Long departmentId = 1L;
        LocalDateTime now = LocalDateTime.now();
        Department expectedDepartment = new Department("IT", "Information Technology", true);
        expectedDepartment.setId(departmentId);
        expectedDepartment.setCreatedAt(now);
        expectedDepartment.setUpdatedAt(now);
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.of(expectedDepartment));

        // Act
        Department actualDepartment = departmentService.getDepartmentById(departmentId);

        // Assert
        assertEquals(expectedDepartment.getId(), actualDepartment.getId());
        assertEquals(expectedDepartment.getName(), actualDepartment.getName());
        assertEquals(expectedDepartment.getDescription(), actualDepartment.getDescription());
        assertEquals(expectedDepartment.getActive(), actualDepartment.getActive());
        assertEquals(expectedDepartment.getCreatedAt(), actualDepartment.getCreatedAt());
        assertEquals(expectedDepartment.getUpdatedAt(), actualDepartment.getUpdatedAt());
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
    void createDepartment_validDepartment_savesAndReturnsCreatedDepartmentWithNewFields() {
        // Arrange
        Department departmentToCreate = new Department("Finance", "Financial Department", true);
        LocalDateTime now = LocalDateTime.now();
        Department savedDepartment = new Department("Finance", "Financial Department", true);
        savedDepartment.setId(3L);
        savedDepartment.setCreatedAt(now);
        savedDepartment.setUpdatedAt(now);
        when(departmentRepository.save(any(Department.class))).thenReturn(savedDepartment);

        // Act
        Department actualDepartment = departmentService.createDepartment(departmentToCreate);

        // Assert
        assertEquals(savedDepartment.getId(), actualDepartment.getId());
        assertEquals(savedDepartment.getName(), actualDepartment.getName());
        assertEquals(savedDepartment.getDescription(), actualDepartment.getDescription());
        assertEquals(savedDepartment.getActive(), actualDepartment.getActive());
        assertEquals(savedDepartment.getCreatedAt(), actualDepartment.getCreatedAt());
        assertEquals(savedDepartment.getUpdatedAt(), actualDepartment.getUpdatedAt());
        verify(departmentRepository, times(1)).save(departmentToCreate);
    }
}