package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.model.Claim;
import com.recorever.recorever_backend.model.Report;
import com.recorever.recorever_backend.repository.ClaimRepository;
import com.recorever.recorever_backend.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    private static final int ADMIN_USER_ID = 1; // temporary admin user ID

    public Map<String, Object> create(int reportId, int userId, String proofDescription) {
        Report targetReport = reportRepo.getReportById(reportId);
        
        if (targetReport == null) {
            throw new RuntimeException("Target Report ID " + reportId + " not found or is invalid for claim creation.");
        }
        
        int id = repo.createClaim(reportId, userId, proofDescription);

        notificationService.create(ADMIN_USER_ID, reportId, 
                String.format("New PENDING claim (Claim #%d) submitted for report #%d.", id, reportId));

        return Map.of(
            "claim_id", id,
            "report_id", reportId,
            "status", "pending",
            "message", "Claim submitted for administrative review."
        );
    }

    public List<Claim> listAllClaims() { return repo.getAllClaims(); }
    
    public List<Claim> listClaimsByUserId(int userId) { 
        return repo.getClaimsByUserId(userId); }

    public Claim getById(int claimId) { return repo.getClaimById(claimId); }

    public boolean updateStatus(int claimId, String status) {
        Claim claim = repo.getClaimById(claimId);
        if (claim == null) return false;

        boolean updated = repo.updateClaimStatus(claimId, status);
        if (!updated) return false;
        
        if (status.equals("approved")) {
            String claimCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            
            reportRepo.setClaimCodes(claim.getReport_id(), null, claimCode); 
            
            String msg = String.format("Claim #%d approved! Your claim code is: **%s**. Please use this to claim your item.", 
                                       claimId, claimCode);
            notificationService.create(claim.getUser_id(), claim.getReport_id(), msg);
        
        } else if (status.equals("claimed")) {
            reportRepo.updateStatus(claim.getReport_id(), "claimed"); 
            
            String msg = String.format("Item collected! The item for Claim #%d has been successfully claimed.", claimId);
            notificationService.create(claim.getUser_id(), claim.getReport_id(), msg);
            
        } else if (status.equals("rejected")) {
            String msg = String.format("Claim #%d has been rejected by the administrator.", claimId);
            notificationService.create(claim.getUser_id(), claim.getReport_id(), msg);
        }
        
        return updated;
    }
}