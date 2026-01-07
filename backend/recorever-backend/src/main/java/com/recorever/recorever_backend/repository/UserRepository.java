package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    @Query("SELECT u FROM User u WHERE u.email = :email " +
           "AND u.isDeleted = false")
    Optional<User> findByEmailAndIsDeletedFalse(
        @Param("email") String email
    );

    @Query("SELECT u FROM User u WHERE u.userId = :id " +
           "AND u.isDeleted = false")
    Optional<User> findByIdAndIsDeletedFalse(
        @Param("id") int id
    );

    @Query("SELECT u FROM User u WHERE (LOWER(u.name) " +
           "LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.email) " +
           "LIKE LOWER(CONCAT('%', :query, '%'))) AND u.isDeleted = false")
    List<User> searchUsers(
        @Param("query") String query
    );

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.name = :name " +
           "AND u.userId != :userId")
    boolean isNameTaken(
        @Param("name") String name, 
        @Param("userId") int userId
    );

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.phoneNumber = :phoneNumber " +
           "AND u.userId != :userId")
    boolean isPhoneNumberTaken(
        @Param("phoneNumber") String phoneNumber, 
        @Param("userId") int userId
    );

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.email = :email " +
           "AND u.userId != :userId")
    boolean isEmailTaken(
        @Param("email") String email, 
        @Param("userId") int userId
    );

    @Query("SELECT u FROM User u WHERE u.refreshToken = :token " +
           "AND u.isDeleted = false")
    Optional<User> findByRefreshTokenAndIsDeletedFalse(
        @Param("token") String token
    );

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.isDeleted = true WHERE u.userId = :id " +
           "AND u.isDeleted = false")
    int softDeleteUser(
        @Param("id") int id
    );
}