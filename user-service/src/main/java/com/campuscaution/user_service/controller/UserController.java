package com.campuscaution.user_service.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.campuscaution.user_service.dto.UserDto;
import com.campuscaution.user_service.model.User;
import com.campuscaution.user_service.service.UserService;

@RestController
@RequestMapping("/api")
public class UserController {

    private static final String NAMESPACE = "https://yourapp.com/";
    
    @Autowired
    private UserService userService;

    @GetMapping("/public/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("User Service is up and running!");
    }

    @GetMapping("/users/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String auth0Id = jwt.getSubject();
        Optional<User> userOpt = userService.getUserByAuth0Id(auth0Id);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            UserDto userDto = convertToDto(user);
            return ResponseEntity.ok(userDto);
        } else {
            // Create a new user if not found
            User newUser = new User();
            newUser.setAuth0Id(auth0Id);
            
            // Get email from namespace
            String email = (String) jwt.getClaim(NAMESPACE + "email");
            if (email == null || email.isEmpty()) {
                email = auth0Id + "@defaultmail.com";
            }
            newUser.setEmail(email);
            
            // Get name from namespace
            String name = (String) jwt.getClaim(NAMESPACE + "name");
            if (name == null || name.isEmpty()) {
                name = "User " + auth0Id.substring(auth0Id.lastIndexOf('|') + 1);
            }
            newUser.setName(name);
            
            // Get role from namespace, default to STUDENT
            String role = (String) jwt.getClaim(NAMESPACE + "role");
            if (role == null || role.isEmpty()) {
                role = "STUDENT";
            }
            newUser.setRole(role);
            
            User savedUser = userService.createUser(newUser);
            return ResponseEntity.ok(convertToDto(savedUser));
        }
    }
    
    @PutMapping("/users/me")
    public ResponseEntity<UserDto> updateCurrentUser(@RequestBody UserDto userDto, @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String auth0Id = jwt.getSubject();
        Optional<User> userOpt = userService.getUserByAuth0Id(auth0Id);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Update user fields from DTO
            if (userDto.getName() != null && !userDto.getName().isEmpty()) {
                user.setName(userDto.getName());
            }
            
            if (userDto.getEmail() != null && !userDto.getEmail().isEmpty()) {
                user.setEmail(userDto.getEmail());
            }
            
            if (userDto.getDepartmentId() != null) {
                user.setDepartmentId(userDto.getDepartmentId());
            }
            
            User updatedUser = userService.updateUser(user);
            return ResponseEntity.ok(convertToDto(updatedUser));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@RequestBody UserDto userDto, @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User user = convertToEntity(userDto);
        user.setAuth0Id(jwt.getSubject());
        
        // Check required fields
        if (user.getEmail() == null || user.getEmail().isEmpty()) {
            String email = (String) jwt.getClaim(NAMESPACE + "email");
            if (email == null || email.isEmpty()) {
                email = jwt.getSubject() + "@defaultmail.com";
            }
            user.setEmail(email);
        }
        
        if (user.getName() == null || user.getName().isEmpty()) {
            String name = (String) jwt.getClaim(NAMESPACE + "name");
            if (name == null || name.isEmpty()) {
                name = "User " + jwt.getSubject().substring(jwt.getSubject().lastIndexOf('|') + 1);
            }
            user.setName(name);
        }
        
        User savedUser = userService.createUser(user);
        return new ResponseEntity<>(convertToDto(savedUser), HttpStatus.CREATED);
    }

    @GetMapping("/admin/users/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        Optional<User> userOpt = userService.getUserById(id);
        
        if (userOpt.isPresent()) {
            UserDto userDto = convertToDto(userOpt.get());
            return ResponseEntity.ok(userDto);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @RequestBody UserDto userDto, 
                                             @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        Optional<User> userOpt = userService.getUserById(id);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Check if it's the same user or an admin
            String auth0Id = jwt.getSubject();
            if (!user.getAuth0Id().equals(auth0Id) && 
                !jwt.getClaim("permissions").toString().contains("manage:users")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Update user fields from DTO
            if (userDto.getName() != null && !userDto.getName().isEmpty()) {
                user.setName(userDto.getName());
            }
            
            if (userDto.getEmail() != null && !userDto.getEmail().isEmpty()) {
                user.setEmail(userDto.getEmail());
            }
            
            // Only admin can change these fields
            if (jwt.getClaim("permissions").toString().contains("manage:users")) {
                if (userDto.getRole() != null && !userDto.getRole().isEmpty()) {
                    user.setRole(userDto.getRole());
                }
                
                if (userDto.getDepartmentId() != null) {
                    user.setDepartmentId(userDto.getDepartmentId());
                }
            }
            
            User updatedUser = userService.updateUser(user);
            return ResponseEntity.ok(convertToDto(updatedUser));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        Optional<User> userOpt = userService.getUserById(id);
        
        if (userOpt.isPresent()) {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    private UserDto convertToDto(User user) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setAuth0Id(user.getAuth0Id());
        userDto.setEmail(user.getEmail());
        userDto.setName(user.getName());
        userDto.setRole(user.getRole());
        userDto.setDepartmentId(user.getDepartmentId());
        return userDto;
    }

    private User convertToEntity(UserDto userDto) {
        User user = new User();
        user.setId(userDto.getId());
        user.setAuth0Id(userDto.getAuth0Id());
        user.setEmail(userDto.getEmail());
        user.setName(userDto.getName());
        user.setRole(userDto.getRole());
        user.setDepartmentId(userDto.getDepartmentId());
        return user;
    }
} 