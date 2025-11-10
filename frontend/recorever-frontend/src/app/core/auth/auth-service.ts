import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, of, catchError, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LoginRequest, LoginResponse } from '../../models/auth-model';
import type { User } from '../../models/user-model';
import { UserService } from '../services/user-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private API_BASE_URL = environment.apiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);
  private injector = inject(Injector);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
  }

  initAuth(): void {
    const token = this.getTokenFromStorage();
    if (token) {
      const userService = this.injector.get(UserService);
      
      userService.getProfile().subscribe({
        error: (err) => {
          console.error('Session token is invalid, logging out.', err);
          this.logout();
        },
      });
    }
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http
      .post<LoginResponse>(`${this.API_BASE_URL}/login-user`, credentials)
      .pipe(
        tap((response: LoginResponse) => {
          localStorage.setItem('authToken', response.access_token);
        }),
        switchMap(() => {
          const userService = this.injector.get(UserService);
          return userService.getProfile();
        }),
        catchError((err) => {
          throw err;
        })
      );
  }

  register(userInfo: any): Observable<any> {
    return this.http.post(`${this.API_BASE_URL}/register-user`, userInfo);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  public updateCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  isLoggedIn(): boolean {
    return !!this.getTokenFromStorage();
  }

  isAdmin(): boolean {
    const user = this.getUserFromStorage();
    return !!user && user.role === 'admin';
  }

  getTokenFromStorage(): string | null {
    return localStorage.getItem('authToken');
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
      return null;
    }
    
    try {
      return JSON.parse(userJson) as User;
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      localStorage.removeItem('currentUser');
      return null;
    }
  }
}