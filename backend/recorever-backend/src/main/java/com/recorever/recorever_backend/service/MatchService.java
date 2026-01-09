package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.dto.MatchResponseDTO;
import com.recorever.recorever_backend.model.Match;
import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.repository.MatchRepository;
import com.recorever.recorever_backend.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchService {

  private static final double MIN_KEYWORD_OVERLAP = 0.5;
  private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
      "a", "an", "the", "in", "on", "at", "and", "or", "to", "for", "of",
      "with", "is", "was", "has", "i", "my", "me", "found", "lost"));

  @Autowired
  private MatchRepository matchRepo;

  @Autowired
  private ReportRepository reportRepo;

  @Autowired
  private NotificationService notificationService;

  private MatchResponseDTO convertToDTO(Match match) {
    if (match == null)
      return null;
    MatchResponseDTO dto = new MatchResponseDTO();
    dto.setMatch_id(match.getMatch_id());
    dto.setLost_report_id(match.getLost_report_id());
    dto.setFound_report_id(match.getFound_report_id());
    dto.setStatus(match.getStatus());
    dto.setCreated_at(match.getCreated_at());
    return dto;
  }

  @Transactional
  public void findAndCreateMatch(Report newReport) {
    List<Report> existingReports = reportRepo.findAll();

    String newType = newReport.getType();
    String matchType = newType.equals("lost") ? "found" : "lost";

    for (Report existingReport : existingReports) {
      if (existingReport.getReportId() == newReport.getReportId() ||
          !existingReport.getType().equals(matchType) ||
          existingReport.isDeleted()) {
        continue;
      }

      if (!"approved".equalsIgnoreCase(existingReport.getStatus())) {
        continue;
      }

      if (checkNameSimilarity(newReport, existingReport)) {
        processMatchCreation(newReport, existingReport, newType);
      }
    }
  }

  /**
   * Finds lost reports for a specific user that match a given found report
   */
  public List<Report> findPotentialMatchesForUser(
      Report foundReport, int claimantId) {
    List<Report> userLostReports = reportRepo
        .findByUserIdAndTypeAndIsDeletedFalse(claimantId, "lost");

    return userLostReports.stream()
        .filter(lostReport -> "approved".equalsIgnoreCase(lostReport.getStatus()) ||
            "matched".equalsIgnoreCase(lostReport.getStatus()))
        .filter(lostReport -> checkNameSimilarity(foundReport, lostReport))
        .collect(Collectors.toList());
  }

  private void processMatchCreation(Report newR, Report existR, String type) {
    boolean isLocMatch = checkLocationProximity(newR, existR);
    boolean isDescMatch = checkDescriptionSimilarity(newR, existR);

    String confidence;

    if (isLocMatch && isDescMatch) {
      confidence = "High-Confidence Match";
    } else if (isLocMatch || isDescMatch) {
      confidence = "Medium-Confidence Match";
    } else {
      confidence = "Low-Confidence Match (Location Conflict)";
    }

    int lostId = type.equals("lost")
        ? newR.getReportId()
        : existR.getReportId();
    int foundId = type.equals("found")
        ? newR.getReportId()
        : existR.getReportId();

    Match match = new Match();
    match.setLostReportId(lostReport.getReportId());
    match.setFoundReportId(foundReport.getReportId());
    match.setStatus("pending");
    matchRepo.save(match);

    newR.setStatus("matched");
    existR.setStatus("matched");
    reportRepo.save(newR);
    reportRepo.save(existR);

    String msgLost = String.format(
        "Match Found: We found a potential match (%s) for your lost %s. Click to verify.",
        confidence, lostReport.getItemName());
    notificationService.create(
        lostReport.getUserId(), lostReport.getReportId(), msgLost, true);

    String msgFound = String.format(
        "Update: The %s you found has been matched to a lost report. Thank you for helping!",
        foundReport.getItemName());
    notificationService.create(
        foundReport.getUserId(), foundReport.getReportId(), msgFound, true);
  }

  private boolean checkNameSimilarity(Report report1, Report report2) {
    String name1 = report1.getItemName().toLowerCase();
    String name2 = report2.getItemName().toLowerCase();
    return name1.contains(name2) || name2.contains(name1);
  }

  private boolean checkLocationProximity(Report report1, Report report2) {
    String loc1 = report1.getLocation().trim().toLowerCase();
    String loc2 = report2.getLocation().trim().toLowerCase();
    return loc1.equals(loc2);
  }

  private boolean checkDescriptionSimilarity(Report r1, Report r2) {
    String d1 = r1.getDescription() != null
        ? r1.getDescription().toLowerCase()
        : "";
    String d2 = r2.getDescription() != null
        ? r2.getDescription().toLowerCase()
        : "";

    if (d1.isEmpty() || d2.isEmpty())
      return false;

    Set<String> set1 = tokenize(d1);
    Set<String> set2 = tokenize(d2);

    Set<String> intersect = new HashSet<>(set1);
    intersect.retainAll(set2);

    Set<String> union = new HashSet<>(set1);
    union.addAll(set2);

    if (union.isEmpty())
      return false;

    double score = (double) intersect.size() / union.size();
    return score >= MIN_KEYWORD_OVERLAP;
  }

  private Set<String> tokenize(String description) {
    String cleaned = description.replaceAll("[^a-z0-9\\s]", " ");
    String[] words = cleaned.split("\\s+");

    Set<String> tokens = new HashSet<>();
    for (String word : words) {
      word = word.trim();
      if (!word.isEmpty() && word.length() > 2 && !STOP_WORDS.contains(word)) {
        tokens.add(word);
      }
    }
    return tokens;
  }

  public List<MatchResponseDTO> listAllMatches() {
    return matchRepo.findAll().stream()
        .map(this::convertToDTO)
        .collect(Collectors.toList());
  }

  public MatchResponseDTO getMatchById(int id) {
    return matchRepo.findById(id)
        .map(this::convertToDTO)
        .orElse(null);
  }

  public MatchResponseDTO getMatchByReportId(int reportId) {
    return matchRepo.findByReportId(reportId)
        .map(this::convertToDTO)
        .orElse(null);
  }

  @Transactional
  public boolean updateMatchStatus(int id, String status) {
    return matchRepo.findById(id).map(match -> {
      match.setStatus(status);
      matchRepo.save(match);
      return true;
    }).orElse(false);
  }
}