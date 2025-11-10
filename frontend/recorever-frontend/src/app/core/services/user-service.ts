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

  // TODO(Durante, Stephanie V.): add the updateProfile() method here later
}