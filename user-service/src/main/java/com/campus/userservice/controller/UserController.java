package com.campus.userservice.controller;

import com.campus.userservice.dto.UserUpdateRequest;
import com.campus.userservice.model.User;
import com.campus.userservice.repository.UserRepository;
import com.campus.userservice.repository.RoleRepository;
import com.campus.userservice.domain.events.UserProfileUpdatedEvent;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

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
    private ApplicationEventPublisher eventPublisher;
    
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
    @Operation(summary = "Update user by internal ID", description = "Updates user information (firstName, lastName). Only the owner can update.")
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

        eventPublisher.publishEvent(new UserProfileUpdatedEvent(
            updatedUser.getId(),
            oldEmail,
            updatedUser.getEmail()
        ));

        return ResponseEntity.ok(updatedUser);
    }
    
    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Retrieves the currently authenticated user's profile based on the token")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal Jwt principal) {
        String entraId = principal.getClaimAsString("oid");
        if (entraId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByEntraId(entraId)
                .orElseThrow(() -> new EntityNotFoundException("User profile not found for Entra ID: " + entraId));
        
        return ResponseEntity.ok(user);
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