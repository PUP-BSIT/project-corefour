package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.dto.ClaimResponseDTO;
import com.recorever.recorever_backend.dto.ManualClaimRequestDTO;
import com.recorever.recorever_backend.model.Claim;
import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.repository.ClaimRepository;
import com.recorever.recorever_backend.repository.ReportRepository;
import com.recorever.recorever_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ClaimService {

  @Autowired
  private ClaimRepository repo;

  @Autowired
  private ReportRepository reportRepo;

  @Autowired
  private NotificationService notificationService;

  @Autowired
  private UserRepository userRepository;

  private static final int ADMIN_USER_ID = 1;

  public List<ClaimResponseDTO> getClaimsForReport(int reportId) {
    return repo.findByReportId(reportId).stream()
        .map(this::mapToClaimResponseDTO)
        .collect(Collectors.toList());
  }

  public String getClaimCode(int userId, int reportId) {
    return repo.findClaimCode(userId, reportId).orElse(null);
  }

  public Claim getClaimByReportId(int reportId) {
    Claim claim = repo.findTopByReportId(reportId).orElse(null);
    if (claim != null) {
      populateTransientUserData(claim);
    }
    return claim;
  }

  public List<ClaimResponseDTO> getClaimsByUserId(int userId) {
    return repo.findByUserId(userId).stream()
        .map(this::mapToClaimResponseDTO)
        .collect(Collectors.toList());
  }

  public List<ClaimResponseDTO> listAllClaimsForAdmin() {
    return repo.findAllOrderByCreatedAtDesc().stream()
        .map(this::mapToClaimResponseDTO)
        .collect(Collectors.toList());
  }

  @Transactional
  public Claim createManualClaim(ManualClaimRequestDTO req) {
      int reportId = req.getReport_id().intValue();
      Report foundReport = reportRepo.findByReportIdAndIsDeletedFalse(reportId)
              .orElseThrow(() -> new RuntimeException("Found report not found"));

      Claim claim = new Claim();
      claim.setReportId(reportId);
      claim.setClaimantName(req.getClaimant_name());
      claim.setContactEmail(req.getContact_email());
      claim.setContactPhone(req.getContact_phone());
      claim.setAdminRemarks(req.getAdmin_remarks());
      claim.setCreatedAt(LocalDateTime.now().toString());

      if (req.getMatching_lost_report_id() != null) {
          int lostId = req.getMatching_lost_report_id().intValue();
          claim.setMatchingLostReportId(lostId);

          Report lostReport = reportRepo.findByReportIdAndIsDeletedFalse(lostId)
                  .orElseThrow(() -> new RuntimeException(
                          "Matching lost report not found"));

          lostReport.setStatus("resolved");
          lostReport.setDateResolved(LocalDateTime.now().toString());
          reportRepo.save(lostReport);

          // NOTIFICATION: To the user who LOST the item
          String lostMsg = String.format(
                  "Your lost item '%s' has been resolved. " +
                  "We're glad we could help you find it!",
                  lostReport.getItemName());

          notificationService.create(
                  lostReport.getUserId(), lostId, lostMsg, true);
      }

      Claim saved = repo.save(claim);
      foundReport.setStatus("claimed");
      reportRepo.save(foundReport);

      // NOTIFICATION: To the user who FOUND the item
      String foundMsg = String.format(
          "Good news! Your found item '%s' has been successfully claimed. " +
          "Thank you for your honesty and for being a hero in our community!",
          foundReport.getItemName());

      notificationService.create(
              foundReport.getUserId(), reportId, foundMsg, true);

      return saved;
  }

  private void populateTransientUserData(Claim claim) {
    if (claim.getUserId() != null) {
      userRepository.findById(claim.getUserId()).ifPresent(u -> {
        if (claim.getClaimantName() == null)
          claim.setClaimantName(u.getName());
        if (claim.getContactEmail() == null)
          claim.setContactEmail(u.getEmail());
        if (claim.getContactPhone() == null)
          claim.setContactPhone(u.getPhoneNumber());
      });

      repo.findClaimCode(claim.getUserId(), claim.getReportId())
          .ifPresent(code -> claim.setClaimCode(code));
    }
  }

  private ClaimResponseDTO mapToClaimResponseDTO(Claim claim) {
    ClaimResponseDTO dto = new ClaimResponseDTO();

    dto.setClaim_id(claim.getClaimId());
    dto.setReport_id(claim.getReportId());
    dto.setAdmin_remarks(claim.getAdminRemarks());
    dto.setCreated_at(claim.getCreatedAt());
    dto.setClaimant_name(claim.getClaimantName());
    dto.setContact_email(claim.getContactEmail());
    dto.setContact_phone(claim.getContactPhone());

    return dto;
  }
}