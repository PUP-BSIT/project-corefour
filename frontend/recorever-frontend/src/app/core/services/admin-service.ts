import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Report } from '../../models/item-model';
import { DashboardData } from '../../models/admin-stats-model';

type StatusUpdateResponse = {
  success: boolean;
  message?: string;
};

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private dashboardCache = new Map<string, Observable<DashboardData>>();

  getReportById(reportId: number): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/report/${reportId}`);
  }

  updateReportStatus(
    reportId: number,
    status: string
  ): Observable<StatusUpdateResponse> {
    const endpoint = `${this.apiUrl}/admin/report/${reportId}/status`;
    return this.http.put<StatusUpdateResponse>(endpoint, { status: status });
  }

  getDashboardData(range: string = '15'): Observable<DashboardData> {
    if (!this.dashboardCache.has(range)) {
      const params = new HttpParams().set('days', range);
      
      const request$ = this.http
        .get<DashboardData>(`${this.apiUrl}/admin/dashboard-stats`, { params })
        .pipe(
          shareReplay(1)
        );

      this.dashboardCache.set(range, request$);
    }

    return this.dashboardCache.get(range)!;
  }

  clearCache() {
    this.dashboardCache.clear();
  }
}