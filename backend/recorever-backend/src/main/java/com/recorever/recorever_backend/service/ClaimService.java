package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.dto.ClaimResponseDTO;
import com.recorever.recorever_backend.dto.ManualClaimRequestDTO;
import com.recorever.recorever_backend.model.Claim;
import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.repository.ClaimRepository;
import com.recorever.recorever_backend.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ClaimService {

  @Autowired
  private ClaimRepository repo;

  @Autowired
  private ReportRepository reportRepo;

  @Autowired
  private NotificationService notificationService;

  private static final int ADMIN_USER_ID = 1;

  public List<ClaimResponseDTO> listAllClaimsForAdmin() {
    return repo.getAllClaimsWithDetails();
  }

  @Transactional
  public Claim createManualClaim(ManualClaimRequestDTO req) {
    int reportId = req.getReport_id().intValue();

    Report report = reportRepo.getReportById(reportId);
    if (report == null) {
      throw new RuntimeException("Target Report not found");
    }

    Claim claim = new Claim();
    claim.setReport_id(reportId);
    claim.setClaimant_name(req.getClaimant_name());
    claim.setContact_email(req.getContact_email());
    claim.setContact_phone(req.getContact_phone());
    claim.setAdmin_remarks(req.getAdmin_remarks());
    claim.setCreated_at(LocalDateTime.now());

    Claim savedClaim = repo.save(claim);

    reportRepo.updateStatus(reportId, "claimed");

    return savedClaim;
  }

  public Map<String, Object> create(int reportId, int userId) {
    Report targetReport = reportRepo.getReportById(reportId);

    if (targetReport == null) {
      throw new RuntimeException("Target Report ID " + reportId + " not found.");
    }

    String claimCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

    int id = repo.createClaim(reportId, userId, claimCode);

    String itemName = targetReport.getItem_name();
    notificationService.create(ADMIN_USER_ID, reportId,
        String.format("New Claim #%d submitted for item: %s. Code: %s", id, itemName, claimCode), false);

    return Map.of(
        "claim_id", id,
        "claim_code", claimCode,
        "status", "pending",
        "message", "Claim ticket created successfully.");
  }

  public List<ClaimResponseDTO> getClaimsForReport(int reportId) {
    return repo.getClaimsForReport(reportId);
  }

  public String getClaimCode(int userId, int reportId) {
    return repo.getClaimCode(userId, reportId);
  }

  // for future cleaning up
  // public boolean updateStatus(int claimId, String status, String remarks) {
  // Claim claim = repo.getClaimById(claimId);
  // if (claim == null) return false;

  // String dbStatus = status;
  // if ("claimed".equalsIgnoreCase(status)) {
  // dbStatus = "approved";
  // }

  // boolean updated = repo.updateClaimStatus(claimId, dbStatus, remarks);
  // if (!updated) return false;

  // if ("claimed".equalsIgnoreCase(status)) {
  // reportRepo.updateStatus(claim.getReport_id(), "claimed");

  // String msg = String.format("Success! You have successfully collected the item
  // for Claim #%d.", claimId);
  // notificationService.create(claim.getUser_id(), claim.getReport_id(), msg);

  // List<ClaimResponseDTO> allClaims =
  // repo.getClaimsForReport(claim.getReport_id());
  // for (ClaimResponseDTO otherClaim : allClaims) {
  // if (otherClaim.getClaim_id() != claimId &&
  // !otherClaim.getStatus().equals("rejected")) {
  // String autoRejectReason = "System Auto-Rejection: Item has been claimed by
  // another user.";
  // repo.updateClaimStatus(otherClaim.getClaim_id(), "rejected",
  // autoRejectReason);

  // String loserMsg = String.format("Update: Your claim for item '%s' was closed
  // because the item was claimed by another user.",
  // otherClaim.getItem_name());
  // notificationService.create(otherClaim.getUser_id(),
  // otherClaim.getReport_id(), loserMsg);
  // }
  // }
  // } else if ("rejected".equalsIgnoreCase(status)) {
  // String msg = String.format("Update: Your claim #%d was rejected. Admin
  // Remarks: %s",
  // claimId, remarks);
  // notificationService.create(claim.getUser_id(), claim.getReport_id(), msg);
  // }

  // return updated;
  // }

  public List<ClaimResponseDTO> getClaimsByUserId(int userId) {
    return repo.getClaimsByUserIdDTO(userId);
  }

  public Claim getById(int claimId) {
    return repo.getClaimById(claimId);
  }

  public Claim getClaimByReportId(int reportId) {
    return repo.getClaimByReportId(reportId);
  }
}