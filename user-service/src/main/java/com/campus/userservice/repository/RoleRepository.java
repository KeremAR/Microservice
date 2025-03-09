package com.campus.userservice.repository;

import com.campus.userservice.model.Role;
import com.campus.userservice.model.Role.ERole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(ERole name);
    
    Boolean existsByName(ERole name);
} 