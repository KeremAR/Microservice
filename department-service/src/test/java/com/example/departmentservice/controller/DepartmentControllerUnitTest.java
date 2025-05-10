package com.example.departmentservice.controller;

import com.example.departmentservice.dto.DepartmentDto;
import com.example.departmentservice.model.Department;
import com.example.departmentservice.service.DepartmentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@WebMvcTest(DepartmentController.class)
public class DepartmentControllerUnitTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DepartmentService departmentService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getAllDepartments_returnsOkAndDepartmentListWithNewFields() throws Exception {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        List<Department> departments = Arrays.asList(
                new Department("IT", "Information Technology", true),
                new Department("HR", "Human Resources", false)
        );
        departments.get(0).setId(1L);
        departments.get(0).setCreatedAt(now);
        departments.get(0).setUpdatedAt(now);
        departments.get(1).setId(2L);
        departments.get(1).setCreatedAt(now.minusDays(1));
        departments.get(1).setUpdatedAt(now.minusDays(1));
        when(departmentService.getAllDepartments()).thenReturn(departments);

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.get("/departments/get-all")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].name").value("IT"))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].description").value("Information Technology"))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].active").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].createdAt").exists())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].updatedAt").exists())
                .andExpect(MockMvcResultMatchers.jsonPath("$[1].active").value(false));
    }

    @Test
    void getDepartmentById_existingId_returnsOkAndDepartmentWithNewFields() throws Exception {
        // Arrange
        Long departmentId = 1L;
        LocalDateTime now = LocalDateTime.now();
        Department department = new Department("IT", "Information Technology", true);
        department.setId(departmentId);
        department.setCreatedAt(now);
        department.setUpdatedAt(now);
        when(departmentService.getDepartmentById(departmentId)).thenReturn(department);

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.get("/departments/{id}", departmentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(departmentId))
                .andExpect(MockMvcResultMatchers.jsonPath("$.name").value("IT"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.active").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.createdAt").exists())
                .andExpect(MockMvcResultMatchers.jsonPath("$.updatedAt").exists());
    }

    @Test
    void createDepartment_validDepartmentDto_returnsCreatedAndDepartmentDto() throws Exception {
        // Arrange
        DepartmentDto departmentToCreateDto = new DepartmentDto();
        departmentToCreateDto.setName("Finance");
        departmentToCreateDto.setDescription("Financial Department");

        Department createdDepartment = new Department("Finance", "Financial Department", true);
        createdDepartment.setId(3L);
        createdDepartment.setCreatedAt(LocalDateTime.now());
        createdDepartment.setUpdatedAt(LocalDateTime.now());

        DepartmentDto createdDepartmentDto = new DepartmentDto();
        createdDepartmentDto.setId(3L);
        createdDepartmentDto.setName("Finance");
        createdDepartmentDto.setDescription("Financial Department");

        when(departmentService.createDepartment(any(Department.class))).thenReturn(createdDepartment);

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.post("/departments/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(departmentToCreateDto)))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(3))
                .andExpect(MockMvcResultMatchers.jsonPath("$.name").value("Finance"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.description").value("Financial Department"));
    }
}