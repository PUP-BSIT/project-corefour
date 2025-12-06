import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { Claim } from '../../models/claim-model';
import type { Report } from '../../models/item-model';

@Injectable({
  providedIn: 'root',
})
export class ClaimService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  submitClaim(reportId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/claim`, { report_id: reportId });
  }

  getTicketCode(reportId: number): Observable<{ claim_code: string }> {
    return this.http.get<{ claim_code: string }>(`${this.apiUrl}/claim/ticket/${reportId}`);
  }

  getClaimsForAdmin(reportId: number): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.apiUrl}/claims/report/${reportId}`);
  }

  updateClaimStatus(claimId: number, status: string, remarks: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/claim/${claimId}/status`, { 
      status: status, 
      admin_remarks: remarks 
    });
  }

  getMyClaims(userId: number): Observable<Report[]> {
    return this.http.get<any[]>(`${this.apiUrl}/claims/user`).pipe(
      map((claims) => {
        if (!claims) return [];

        return claims
          .filter((claim) => claim && claim.report)
          .map((claim) => {
            return {
              ...claim.report, 
              reporter_name: claim.report.reporter_name || 'Anonymous', 
              status: claim.status,         
              claim_id: claim.claim_id,
              claim_code: claim.claim_code,
              type: 'claim',
            } as Report;
          });
      })
    );
  }
}