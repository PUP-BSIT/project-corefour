package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.model.ReportSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportScheduleRepository 
        extends JpaRepository<ReportSchedule, Long> {

    Optional<ReportSchedule> findByReportId(int reportId);

    @Query("SELECT rs.reportId FROM ReportSchedule rs " +
           "WHERE rs.notify1Sent = false " +
           "AND rs.notify1Time <= :now " +
           "AND rs.reportId IN (SELECT r.reportId FROM Report r " +
           "WHERE r.isDeleted = false)")
    List<Integer> findReportsForNotify1(@Param("now") LocalDateTime now);

    @Query("SELECT rs.reportId FROM ReportSchedule rs " +
           "WHERE rs.notify2Sent = false " +
           "AND rs.notify2Time <= :now " +
           "AND rs.reportId IN (SELECT r.reportId FROM Report r " +
           "WHERE r.isDeleted = false)")
    List<Integer> findReportsForNotify2(@Param("now") LocalDateTime now);

    @Query("SELECT r FROM Report r JOIN ReportSchedule rs " +
           "ON r.reportId = rs.reportId " +
           "WHERE r.isDeleted = false AND rs.deleteTime <= :now")
    List<Report> findReportsReadyForSoftDelete(@Param("now") LocalDateTime now);

    @Modifying
    @Transactional
    @Query("UPDATE ReportSchedule rs SET rs.notify1Sent = true " +
           "WHERE rs.reportId IN :reportIds")
    int markNotify1Sent(@Param("reportIds") List<Integer> reportIds);

    @Modifying
    @Transactional
    @Query("UPDATE ReportSchedule rs SET rs.notify2Sent = true " +
           "WHERE rs.reportId IN :reportIds")
    int markNotify2Sent(@Param("reportIds") List<Integer> reportIds);
}