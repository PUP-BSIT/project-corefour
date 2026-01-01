import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Claim } from '../../models/claim-model';

@Injectable({
  providedIn: 'root',
})
export class ClaimService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllClaims(): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.apiUrl}/admin/claims`);
  }

  getClaimsForReport(reportId: number): Observable<Claim[]> {
    return this.http.get<Claim[]>(
        `${this.apiUrl}/claims/report/${reportId}`
    );
  }

  getTicketCode(reportId: number): Observable<{ claim_code: string }> {
    return this.http.get<{ claim_code: string }>(
        `${this.apiUrl}/claim/ticket/${reportId}`
    );
  }

  getClaimByReportId(reportId: number): Observable<Claim> {
  return this.http.get<Claim>(`${this.apiUrl}/claim/report/${reportId}`);
}

  getMyClaims(userId: number): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.apiUrl}/claims/user`);
  }

  submitClaim(reportId: number): Observable<{
      claim_id: number;
      claim_code: string
  }> {
    return this.http.post<{ claim_id: number; claim_code: string }>(
        `${this.apiUrl}/claim`,
        { report_id: reportId }
    );
  }

  updateClaimStatus(
      claimId: number,
      status: string,
      remarks: string
  ): Observable<void> {
    const payload = { admin_remarks: remarks };
    let url = `${this.apiUrl}/claim/${claimId}/status`;

    if (status === 'approved') {
      url = `${this.apiUrl}/admin/claim/${claimId}/approve`;
    } else if (status === 'rejected') {
      url = `${this.apiUrl}/admin/claim/${claimId}/reject`;
    } else if (status === 'claimed') {
      url = `${this.apiUrl}/admin/claim/${claimId}/finalize`;
    } else {
        return this.http.put<void>(url, { status, ...payload });
    }

    return this.http.put<void>(url, payload);
  }

  createManualClaim(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/claims`, payload);
  }
}