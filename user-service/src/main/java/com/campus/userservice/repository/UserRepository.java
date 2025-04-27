package com.campus.userservice.repository;

import com.campus.userservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    
    // Find user by Microsoft Entra ID Object ID
    Optional<User> findByEntraId(String entraId);

    // Find user by email
    Optional<User> findByEmail(String email);

    Boolean existsByUsername(String username);
    
    Boolean existsByEmail(String email);

    // Check if a user exists with the given Entra ID
    Boolean existsByEntraId(String entraId);
} 