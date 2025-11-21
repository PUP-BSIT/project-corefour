import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { 
  Report, 
  ReportFilters, 
  FinalReportSubmission 
} from '../../models/item-model';
import type { Claim } from '../../models/claim-model';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  createReport(report: FinalReportSubmission): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/report`, report);
  }

  getReports(filters: ReportFilters): Observable<Report[]> {
    let params = new HttpParams();

    let endpoint = `${this.apiUrl}/reports`;

    if (filters.type) {
      endpoint = `${this.apiUrl}/reports/type/${filters.type}`;
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.item_name) {
      params = params.set('item_name', filters.item_name);
    }
    if (filters.location) {
      params = params.set('location', filters.location);
    }

    return this.http.get<Report[]>(endpoint, { params });
  }

  deleteReport(reportId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/report/${reportId}`);
  }

  getClaimedReports(userId: number): Observable<Report[]> {
    return this.http.get<Claim[]>(`${this.apiUrl}/claims/user`).pipe(
      map((claims) => {
        if (!claims) return [];
        
        return claims.map((claim) => ({
            report_id: claim.report_id,
            user_id: userId,
            type: 'found',
            item_name: claim.item_name || 'Unknown Item', 
            location: 'Claimed Item',
            date_reported: claim.created_at,
            date_resolved: null,
            description: claim.admin_remarks || '', 
            status: claim.status as any, 
            surrender_code: null,
            claim_code: claim.claim_code || null
          } as Report));
      })
    );
  }

  deleteReport(reportId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/report/${reportId}`);
  }
}
