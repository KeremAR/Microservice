package com.campus.userservice.config;

// import com.campus.userservice.model.ERole; // REMOVED incorrect import
import com.campus.userservice.model.Role;
import com.campus.userservice.repository.RoleRepository;
// import com.campus.userservice.repository.UserRepository; // No longer needed
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class DataInitializer {

    @Autowired
    private RoleRepository roleRepository;

    @PostConstruct
    public void init() {
        // Create roles if they don't exist
        // Use the nested Role.ERole enum directly
        createRoleIfNotExists(Role.ERole.ROLE_ADMIN);
        createRoleIfNotExists(Role.ERole.ROLE_STAFF);
        createRoleIfNotExists(Role.ERole.ROLE_STUDENT);
    }

    private void createRoleIfNotExists(Role.ERole roleName) { // Update parameter type
        // findByName likely expects Role.ERole now
        if (!roleRepository.findByName(roleName).isPresent()) { 
            // Role constructor also expects Role.ERole
            roleRepository.save(new Role(null, roleName)); 
        }
    }
} 