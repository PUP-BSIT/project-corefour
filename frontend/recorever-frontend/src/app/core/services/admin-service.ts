import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Report } from '../../models/item-model';

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

  getReportById(reportId: number): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/report/${reportId}`);
  }

  updateReportStatus(
    reportId: number,
    status: string
  ): Observable<StatusUpdateResponse> {
    const endpoint =
        `${this.apiUrl}/admin/report/${reportId}/status`;
    return this.http.put<StatusUpdateResponse>(
      endpoint,
      { status: status }
    );
  }
}