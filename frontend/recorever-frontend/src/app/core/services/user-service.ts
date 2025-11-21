import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth-service';
import type { User } from '../../models/user-model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private API_BASE_URL = environment.apiUrl;

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_BASE_URL}/get-user-data`).pipe(
      tap(user => {
        this.authService.updateCurrentUser(user);
      })
    );
  }

  updateProfile(user: User, file: File | null): Observable<User> {
    const formData = new FormData();
    
    formData.append('name', user.name);
    formData.append('phone_number', user.phone_number);

    if (file) {
    }

    return this.http.put<User>(
      `${this.API_BASE_URL}/update-user-data`, 
      formData
    ).pipe(
      tap(updatedUser => {
        this.authService.updateCurrentUser(updatedUser);
      })
    );
  }
}