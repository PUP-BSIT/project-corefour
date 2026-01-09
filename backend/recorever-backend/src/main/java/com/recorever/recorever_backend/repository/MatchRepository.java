package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Integer> {

  List<Match> findAllByOrderByCreatedAtDesc();

  @Modifying
  @Transactional
  @Query("UPDATE Match m SET m.status = :status WHERE m.matchId = :id")
  int updateMatchStatus(@Param("id") int id, @Param("status") String status);

  @Query("SELECT m FROM Match m WHERE m.lostReportId = :reportId OR m.foundReportId = :reportId")
  Optional<Match> findByReportId(@Param("reportId") int reportId);
}