import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Claim } from '../../models/claim-model';

@Injectable({
  providedIn: 'root',
})
export class ClaimService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllClaims(): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.apiUrl}/admin/claims`);
  }

  approveClaim(claimId: number): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/admin/claim/${claimId}/approve`,
      {}
    );
  }

  rejectClaim(claimId: number): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/admin/claim/${claimId}/reject`,
      {}
    );
  }
}