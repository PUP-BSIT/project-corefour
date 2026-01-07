package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.Report;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {

    @Query("SELECT r FROM Report r WHERE r.isDeleted = false")
    List<Report> findAllActive(Pageable pageable);

    @Query("SELECT r FROM Report r LEFT JOIN User u ON r.userId = u.userId " +
           "WHERE r.isDeleted = false " +
           "AND (:userId IS NULL OR r.userId = :userId) " +
           "AND (:type IS NULL OR r.type = :type) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:query IS NULL OR LOWER(r.itemName) LIKE " +
           "LOWER(CONCAT('%',:query,'%')) " +
           "OR LOWER(r.description) LIKE LOWER(CONCAT('%',:query,'%')) " +
           "OR LOWER(r.location) LIKE LOWER(CONCAT('%',:query,'%')) " +
           "OR LOWER(u.name) LIKE LOWER(CONCAT('%',:query,'%'))) " +
           "ORDER BY r.reportId DESC")
    List<Report> searchReports(@Param("userId") Integer userId,
                               @Param("type") String type,
                               @Param("status") String status,
                               @Param("query") String query,
                               Pageable pageable);

    @Query("SELECT COUNT(r) FROM Report r " +
           "LEFT JOIN User u ON r.userId = u.userId " +
           "WHERE r.isDeleted = false " +
           "AND (:userId IS NULL OR r.userId = :userId) " +
           "AND (:type IS NULL OR r.type = :type) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:query IS NULL OR LOWER(r.itemName) LIKE " +
           "LOWER(CONCAT('%',:query,'%')) " +
           "OR LOWER(u.name) LIKE LOWER(CONCAT('%',:query,'%')))")
    int countSearchReports(@Param("userId") Integer userId,
                           @Param("type") String type,
                           @Param("status") String status,
                           @Param("query") String query);

    List<Report> findByStatusAndIsDeletedFalseOrderByDateReportedDesc(
            String status);

    List<Report> findByTypeAndIsDeletedFalseOrderByDateReportedDesc(
            String type);

    List<Report> findByTypeAndStatusAndIsDeletedFalseOrderByDateReportedDesc(
            String type, String status);

    Optional<Report> findByReportIdAndIsDeletedFalse(int id);

    @Modifying
    @Transactional
    @Query("UPDATE Report r SET r.isDeleted = true " +
           "WHERE r.isDeleted = false AND r.reportId IN " +
           "(SELECT rs.reportId FROM ReportSchedule rs " +
           "WHERE rs.deleteTime <= :currentTime)")
    int softDeleteExpiredReports(@Param("currentTime") LocalDateTime currentTime);

    @Modifying
    @Transactional
    @Query("UPDATE Report r SET r.isDeleted = true WHERE r.reportId = :id")
    int softDeleteById(@Param("id") int id);

    int countByIsDeletedFalse();

    int countByStatusAndIsDeletedFalse(String status);

    int countByTypeAndIsDeletedFalse(String type);

    @Query(value = "SELECT DATE_FORMAT(date_reported, '%m-%d') as label, " +
                   "COUNT(*) as value FROM reports " +
                   "WHERE date_reported >= DATE_SUB(NOW(), INTERVAL :days DAY) " +
                   "AND is_deleted = 0 GROUP BY label ORDER BY label ASC",
           nativeQuery = true)
    List<Map<String, Object>> getReportsOverTime(@Param("days") int days);

    @Query("SELECT r.location FROM Report r WHERE r.isDeleted = false " +
           "AND r.location IS NOT NULL AND r.location != '' " +
           "GROUP BY r.location ORDER BY COUNT(r) DESC")
    List<String> getTopLocations();
}