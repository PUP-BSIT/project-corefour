import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Report, ReportFilters } from '../../models/item-model';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;


  getReports(filters: ReportFilters): Observable<Report[]> {
    let params = new HttpParams();

    params = params.set('type', filters.type);

    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.item_name) {
      params = params.set('item_name', filters.item_name);
    }
    if (filters.location) {
      params = params.set('location', filters.location);
    }

    return this.http.get<Report[]>(`${this.apiUrl}/reports`, { params });
  }
}