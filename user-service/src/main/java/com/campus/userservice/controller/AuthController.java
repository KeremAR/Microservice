package com.campus.userservice.controller;

import com.campus.userservice.model.ERole;
import com.campus.userservice.model.User;
import com.campus.userservice.payload.request.LoginRequest;
import com.campus.userservice.payload.request.SignUpRequest;
import com.campus.userservice.payload.response.JwtResponse;
import com.campus.userservice.payload.response.MessageResponse;
import com.campus.userservice.repository.UserRepository;
import com.campus.userservice.security.jwt.JwtUtils;
import com.campus.userservice.security.services.UserDetailsServiceImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignUpRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = User.builder()
                .firstName(signUpRequest.getFirstName())
                .lastName(signUpRequest.getLastName())
                .email(signUpRequest.getEmail())
                .username(signUpRequest.getEmail()) // Use email as username for now
                .password(encoder.encode(signUpRequest.getPassword()))
                .build();

        Set<ERole> roles = new HashSet<>();
        roles.add(ERole.ROLE_STUDENT); // Default role
        user.setRoles(roles);

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
    
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();        
        
        // Fetch the User entity to get the ID
        User user = userRepository.findByEmail(userDetails.getUsername()) // getUsername() returns the email here
                .orElseThrow(() -> new RuntimeException("Error: User not found after authentication.")); // Should not happen

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt, 
                                                 user.getId(), 
                                                 user.getEmail(), // Use email from User entity
                                                 roles));
    }
} 