package com.example.departmentservice.controller;

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
    void getAllDepartments_returnsOkAndDepartmentList() throws Exception {
        // Arrange
        List<Department> departments = Arrays.asList(
                new Department("IT", "Information Technology"),
                new Department("HR", "Human Resources")
        );
        departments.get(0).setId(1L);
        departments.get(1).setId(2L);
        when(departmentService.getAllDepartments()).thenReturn(departments);

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.get("/departments")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].name").value("IT"))
                .andExpect(MockMvcResultMatchers.jsonPath("$[1].description").value("Human Resources"));
    }

    @Test
    void getDepartmentById_existingId_returnsOkAndDepartment() throws Exception {
        // Arrange
        Long departmentId = 1L;
        Department department = new Department("IT", "Information Technology");
        department.setId(departmentId);
        when(departmentService.getDepartmentById(departmentId)).thenReturn(department);

        // Act & Assert
        mockMvc.perform(MockMvcRequestBuilders.get("/departments/{id}", departmentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(departmentId))
                .andExpect(MockMvcResultMatchers.jsonPath("$.name").value("IT"));
    }

    @Test
    void createDepartment_validDepartment_returnsCreatedAndDepartment() throws Exception {
        // Arrange
        Department departmentToCreate = new Department("Finance", "Financial Department");
        Department createdDepartment = new Department("Finance", "Financial Department");
        createdDepartment.setId(3L);
        when(departmentService.createDepartment(any(Department.class))).thenReturn(createdDepartment);

        mockMvc.perform(MockMvcRequestBuilders.post("/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(departmentToCreate)))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(3))
                .andExpect(MockMvcResultMatchers.jsonPath("$.name").value("Finance"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.description").value("Financial Department")); // description'ı da ekledim
    }


}

