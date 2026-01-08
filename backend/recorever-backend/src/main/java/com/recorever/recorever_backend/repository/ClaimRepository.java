package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Integer> {

    List<Claim> findByReportIdOrMatchingLostReportId(
       int reportId, int matchingLostReportId);

    @Query("SELECT c FROM Claim c ORDER BY c.createdAt DESC")
    List<Claim> findAllOrderByCreatedAtDesc();

    @Query(value = "SELECT * FROM claims WHERE contact_email = " +
           "(SELECT email FROM users WHERE user_id = :userId) " +
           "ORDER BY created_at DESC", nativeQuery = true)
    List<Claim> findByUserId(@Param("userId") int userId);

    @Query("SELECT c FROM Claim c WHERE c.reportId = :reportId " +
           "ORDER BY c.createdAt DESC")
    List<Claim> findByReportId(@Param("reportId") int reportId);

    @Query(value = "SELECT claim_code FROM claims WHERE contact_email = " +
                   "(SELECT email FROM users WHERE user_id = :userId) " +
                   "AND report_id = :reportId LIMIT 1", nativeQuery = true)
    Optional<String> findClaimCode(@Param("userId") int userId, 
                                   @Param("reportId") int reportId);

    @Query(value = "SELECT * FROM claims WHERE report_id = :reportId " +
                   "ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    Optional<Claim> findTopByReportId(@Param("reportId") int reportId);

    @Modifying
    @Transactional
    @Query("UPDATE Claim c SET c.adminRemarks = :remarks WHERE c.claimId = :id")
    int updateStatus(@Param("id") int id, @Param("remarks") String remarks);
}