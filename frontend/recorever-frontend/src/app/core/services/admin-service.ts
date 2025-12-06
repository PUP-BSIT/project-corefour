import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Report } from '../../models/item-model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getReportById(reportId: number): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/report/${reportId}`);
  }

  approveReport(reportId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/report/${reportId}/approve`, {});
  }

  updateReportStatus(reportId: number, status: string): Observable<any> {
    if (status === 'approved') {
      return this.approveReport(reportId);
    }

  //TODO: The backend needs to implement an endpoint for generic status updates
    const genericUpdateEndpoint =
        `${this.apiUrl}/admin/report/${reportId}/status`;
    return this.http.put(genericUpdateEndpoint, { status: status });
  }
}