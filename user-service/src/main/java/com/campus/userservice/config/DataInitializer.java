package com.campus.userservice.config;

import com.campus.userservice.model.Role;
import com.campus.userservice.model.User;
import com.campus.userservice.repository.RoleRepository;
import com.campus.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostConstruct
    public void init() {
        // Create roles if they don't exist
        Role adminRole = roleRepository.findByName(Role.ERole.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(null, Role.ERole.ROLE_ADMIN)));
        Role staffRole = roleRepository.findByName(Role.ERole.ROLE_STAFF)
                .orElseGet(() -> roleRepository.save(new Role(null, Role.ERole.ROLE_STAFF)));
        Role studentRole = roleRepository.findByName(Role.ERole.ROLE_STUDENT)
                .orElseGet(() -> roleRepository.save(new Role(null, Role.ERole.ROLE_STUDENT)));

        // Create default admin user if it doesn't exist
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@campus.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFirstName("Admin");
            admin.setLastName("User");
            
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            admin.setRoles(roles);
            
            userRepository.save(admin);
        }
    }
} 