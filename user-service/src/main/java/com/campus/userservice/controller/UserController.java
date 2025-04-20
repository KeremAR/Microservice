package com.campus.userservice.controller;

import com.campus.userservice.dto.UserUpdateRequest;
import com.campus.userservice.model.User;
import com.campus.userservice.model.Role;
import com.campus.userservice.model.ERole;
import com.campus.userservice.repository.UserRepository;
import com.campus.userservice.repository.RoleRepository;
import com.campus.userservice.domain.events.UserProfileUpdatedEvent;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "User management API endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class UserController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    @Value("${rabbitmq.exchange.user}")
    private String userEventsExchangeName;
    
    private boolean isOwnerOrAdmin(Jwt principal, String targetEntraId) {
        String requesterEntraId = principal.getClaimAsString("oid");
        List<String> roles = principal.getClaimAsStringList("roles");
        
        boolean isAdmin = roles != null && roles.contains("ROLE_ADMIN");
        boolean isOwner = Objects.equals(requesterEntraId, targetEntraId);

        return isAdmin || isOwner;
    }
    
    private boolean isOwner(Jwt principal, String targetEntraId) {
        String requesterEntraId = principal.getClaimAsString("oid"); 
        return Objects.equals(requesterEntraId, targetEntraId);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get user by internal ID", description = "Retrieves user information by internal database ID")
    public ResponseEntity<User> getUserById(@PathVariable Long id, @AuthenticationPrincipal Jwt principal) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
        
        if (!isOwnerOrAdmin(principal, user.getEntraId())) {
            throw new AccessDeniedException("You do not have permission to view this user.");
        }

        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update user by internal ID", description = "Updates user information and publishes an event to RabbitMQ.")
    @Transactional
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest userDetails, @AuthenticationPrincipal Jwt principal) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        if (!isOwner(principal, user.getEntraId())) {
            throw new AccessDeniedException("You can only update your own profile.");
        }

        String oldEmail = user.getEmail();

        user.setFirstName(userDetails.getFirstName());
        user.setLastName(userDetails.getLastName());

        User updatedUser = userRepository.save(user);

        UserProfileUpdatedEvent event = new UserProfileUpdatedEvent(
            updatedUser.getId(),
            oldEmail,
            updatedUser.getEmail()
        );
        String routingKey = "user.profile.updated";
        rabbitTemplate.convertAndSend(userEventsExchangeName, routingKey, event);
        System.out.println("Published UserProfileUpdatedEvent to RabbitMQ: " + event);

        return ResponseEntity.ok(updatedUser);
    }
    
    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Retrieves the currently authenticated user's profile. Creates the profile if it doesn't exist.")
    @Transactional
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal Jwt principal) {
        String entraId = principal.getClaimAsString("oid");
        if (entraId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }

        User user = userRepository.findByEntraId(entraId).orElseGet(() -> {
            String email = principal.getClaimAsString("email");
            if (email != null && userRepository.existsByEmail(email)) {
                throw new IllegalStateException("User with email " + email + " already exists, but Entra ID mismatch.");
            }
            
            User newUser = User.builder()
                .entraId(entraId)
                .email(email)
                .firstName(principal.getClaimAsString("given_name"))
                .lastName(principal.getClaimAsString("family_name"))
                .username(principal.getClaimAsString("preferred_username"))
                .roles(getDefaultUserRoles()) 
                .build();
            
            System.out.println("Creating new user profile for Entra ID: " + entraId);
            return userRepository.save(newUser);
        });

        return ResponseEntity.ok(user);
    }
    
    private Set<Role> getDefaultUserRoles() {
        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName(Role.ERole.ROLE_STUDENT)
                .orElseThrow(() -> new RuntimeException("Error: Default role ROLE_STUDENT not found."));
        roles.add(userRole);
        return roles;
    }
    
    @GetMapping("/entra/{entraId}")
    @Operation(summary = "Get user by Entra ID (Admin only)", description = "Retrieves user information by Entra ID")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> getUserByEntraId(@PathVariable String entraId) {
         User user = userRepository.findByEntraId(entraId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with Entra ID: " + entraId));
        return ResponseEntity.ok(user);
    }
} 