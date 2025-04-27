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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
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

        eventPublisher.publishEvent(new UserProfileUpdatedEvent(
            updatedUser.getId(),
            oldEmail,
            updatedUser.getEmail()
        ));

        return ResponseEntity.ok(updatedUser);
    }
    
    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Retrieves the currently authenticated user's profile. Creates/Updates the profile if needed.")
    @Transactional
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal Jwt principal) {
        System.out.println("--- JWT Claims Start ---");
        principal.getClaims().forEach((key, value) -> {
            System.out.println(key + ": " + value);
        });
        System.out.println("--- JWT Claims End ---");
        
        String entraId = principal.getClaimAsString("oid");
        if (entraId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }

        // Try to find user by Entra ID first
        Optional<User> userOptional = userRepository.findByEntraId(entraId);

        if (userOptional.isPresent()) {
            // User found by Entra ID, return it
            return ResponseEntity.ok(userOptional.get());
        } else {
            // User not found by Entra ID, try to find by email or create new
            String email = principal.getClaimAsString("email");
            if (email == null || email.isBlank()) {
                email = principal.getClaimAsString("preferred_username");
                System.out.println("Email claim missing or blank, using preferred_username: " + email);
            }

            if (email != null && !email.isBlank()) {
                // Try to find user by email
                Optional<User> userByEmailOptional = userRepository.findByEmail(email);

                if (userByEmailOptional.isPresent()) {
                    // User found by email, update its Entra ID and other details
                    User existingUser = userByEmailOptional.get();
                    System.out.println("User found by email (" + email + "), updating Entra ID to: " + entraId);
                    existingUser.setEntraId(entraId);
                    existingUser.setFirstName(principal.getClaimAsString("given_name"));
                    existingUser.setLastName(principal.getClaimAsString("family_name"));
                    existingUser.setUsername(principal.getClaimAsString("preferred_username") != null ? principal.getClaimAsString("preferred_username") : email);
                    // Optionally update roles if needed, or keep existing ones
                    // existingUser.setRoles(getDefaultUserRoles()); 
                    User updatedUser = userRepository.save(existingUser);
                    return ResponseEntity.ok(updatedUser);
                } else {
                    // User not found by Entra ID or email, create new user
                    User newUser = createNewUserFromJwt(principal, entraId, email);
                    return ResponseEntity.ok(userRepository.save(newUser));
                }
            } else {
                // Cannot find by Entra ID and no valid email found in token, cannot proceed
                 System.err.println("Cannot find user by Entra ID and email claim is missing or blank in token. Cannot create or identify user.");
                 return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null); // Or UNAUTHORIZED?
            }
        }
    }

    // Helper method to create a new user
    private User createNewUserFromJwt(Jwt principal, String entraId, String email) {
         System.out.println("Creating new user profile for Entra ID: " + entraId + " with email: " + email);
         return User.builder()
                .entraId(entraId)
                .email(email)
                .firstName(principal.getClaimAsString("given_name"))
                .lastName(principal.getClaimAsString("family_name"))
                .username(principal.getClaimAsString("preferred_username") != null ? principal.getClaimAsString("preferred_username") : email)
                .roles(getDefaultUserRoles())
                .build();
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