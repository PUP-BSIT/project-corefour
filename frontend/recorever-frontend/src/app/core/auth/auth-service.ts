import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../../models/user-model';
import { LoginRequest, RegisterRequest, LoginResponse } from '../../models/auth-model';
import { environment } from '../../../environments/environment';

const API_BASE_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const user = this.getUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/login-user`, credentials).pipe(
      tap(response => {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));

        this.currentUserSubject.next(response.user);
      })
    );
  }

  register(userInfo: RegisterRequest): Observable<any> {
    return this.http.post(`${API_BASE_URL}/register-user`, userInfo);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
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

  getUserFromStorage(): User | null {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      try {
        return JSON.parse(userString) as User;
      } catch (error) {
        localStorage.removeItem('currentUser');
        return null;
      }
    }
    return null;
  }
}