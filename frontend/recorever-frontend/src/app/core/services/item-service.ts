import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Report,
  ReportFilters,
  FinalReportSubmission,
  PaginatedResponse
} from '../../models/item-model';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  submitFullReport(
      report: FinalReportSubmission,
      files: File[]
  ): Observable<Report> {
    const formData = new FormData();

    formData.append('type', report.type);
    formData.append('item_name', report.item_name);
    formData.append('location', report.location);
    formData.append('description', report.description);

    if (files && files.length > 0) {
      files.forEach((file: File) => {
        formData.append('files', file, file.name);
      });
    }

    return this.http.post<Report>(
        `${this.apiUrl}/reports/full-submit`,
        formData
    );
  }

  getReports(filters: ReportFilters): Observable<PaginatedResponse<Report>> {
    let params = new HttpParams();
    const endpoint = `${this.apiUrl}/reports`;

    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }

    if (filters.size) {
      params = params.set('size', filters.size.toString());
    }

    if (filters.type) {
      params = params.set('type', filters.type);
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    if (filters.user_id) {
      params = params.set(
          'user_id',
          filters.user_id.toString()
      );
    }

    if (filters.query) {
      params = params.set('query', filters.query);
    }

    if (filters.location) {
      params = params.set('location', filters.location);
    }

    return this.http.get<PaginatedResponse<Report>>(endpoint, { params });
  }

  deleteReport(reportId: number): Observable<void> {
    return this.http.delete<void>(
        `${this.apiUrl}/report/${reportId}`
    );
  }

  createReport(report: FinalReportSubmission): Observable<Report> {
    return this.http.post<Report>(
        `${this.apiUrl}/report`,
        report
    );
  }

  updateReportStatus(reportId: number, status: string): Observable<Report> {
    return this.http.put<Report>(
      `${this.apiUrl}/report/${reportId}/status`,
      { status }
    );
  }

  getTopLocations(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/reports/top-locations`); 
  }
}