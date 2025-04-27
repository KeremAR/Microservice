package com.campus.userservice.controller;

import com.campus.userservice.dto.UserUpdateRequest;
import com.campus.userservice.model.User;
import com.campus.userservice.model.ERole;
import com.campus.userservice.repository.UserRepository;
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
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "User management API endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class UserController {
    
    @Autowired
    private UserRepository userRepository;
    
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
    @Operation(summary = "Get current user", description = "Retrieves the currently authenticated user's profile. Creates/Updates the profile, including roles from token.")
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

        // Extract roles from JWT, default to empty set if null
        Set<ERole> rolesFromToken = extractRolesFromJwt(principal);

        Optional<User> userOptional = userRepository.findByEntraId(entraId);

        if (userOptional.isPresent()) {
            User existingUser = userOptional.get();
            // Update user details from token, including roles
            updateUserFromJwt(existingUser, principal, rolesFromToken);
            User savedUser = userRepository.save(existingUser);
            return ResponseEntity.ok(savedUser);
        } else {
            // User not found by Entra ID, try by email
            String email = principal.getClaimAsString("email");
            if (email == null || email.isBlank()) {
                email = principal.getClaimAsString("preferred_username");
                System.out.println("Email claim missing or blank, using preferred_username: " + email);
            }

            if (email != null && !email.isBlank()) {
                Optional<User> userByEmailOptional = userRepository.findByEmail(email);

                if (userByEmailOptional.isPresent()) {
                    // User found by email, update Entra ID and other details including roles
                    User existingUser = userByEmailOptional.get();
                    System.out.println("User found by email (" + email + "), updating Entra ID to: " + entraId);
                    existingUser.setEntraId(entraId); // Link the account
                    updateUserFromJwt(existingUser, principal, rolesFromToken); // Update other details and roles
                    User savedUser = userRepository.save(existingUser);
                    return ResponseEntity.ok(savedUser);
                } else {
                    // User not found by Entra ID or email, create new user with roles from token
                    User newUser = createNewUserFromJwt(principal, entraId, email, rolesFromToken);
                    return ResponseEntity.ok(userRepository.save(newUser));
                }
            } else {
                 System.err.println("Cannot find user by Entra ID and email claim is missing or blank in token. Cannot create or identify user.");
                 return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null); 
            }
        }
    }

    // Helper method to update existing user details from JWT
    private void updateUserFromJwt(User user, Jwt principal, Set<ERole> rolesFromToken) {
        user.setFirstName(principal.getClaimAsString("given_name"));
        user.setLastName(principal.getClaimAsString("family_name"));
        // Ensure username is also updated or set correctly
        String preferredUsername = principal.getClaimAsString("preferred_username");
        user.setUsername(preferredUsername != null ? preferredUsername : user.getEmail()); 
        user.setRoles(rolesFromToken); // Update roles from token
        System.out.println("Updating user (" + user.getEmail() + ") roles from token: " + rolesFromToken);
    }

    // Helper method to create a new user from JWT
    private User createNewUserFromJwt(Jwt principal, String entraId, String email, Set<ERole> rolesFromToken) {
         System.out.println("Creating new user profile for Entra ID: " + entraId + " with email: " + email + " and roles: " + rolesFromToken);
         return User.builder()
                .entraId(entraId)
                .email(email)
                .firstName(principal.getClaimAsString("given_name"))
                .lastName(principal.getClaimAsString("family_name"))
                .username(principal.getClaimAsString("preferred_username") != null ? principal.getClaimAsString("preferred_username") : email)
                .roles(rolesFromToken) // Use roles from token
                .build();
    }
    
    // Helper method to extract roles from JWT claim
    private Set<ERole> extractRolesFromJwt(Jwt principal) {
        List<String> roleStrings = principal.getClaimAsStringList("roles");
        if (roleStrings == null) {
            System.out.println("No 'roles' claim found in JWT. Assigning empty set.");
            return new HashSet<>();
        }
        return roleStrings.stream()
                .map(roleString -> {
                    try {
                        return ERole.valueOf(roleString);
                    } catch (IllegalArgumentException e) {
                        System.err.println("Warning: Unknown role value in JWT roles claim: " + roleString + ". Ignoring.");
                        return null; // Ignore unknown roles
                    }
                })
                .filter(Objects::nonNull) // Filter out nulls from unknown roles
                .collect(Collectors.toSet());
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