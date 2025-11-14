import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject,
        Observable,
        tap,
        of,
        catchError,
        switchMap,
        throwError
} from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LoginRequest,
              LoginResponse,
              RegisterRequest
} from '../../models/auth-model';
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

  private _isRefreshing = false;
  private _refreshTokenSubject = new BehaviorSubject<string | null>(null);

  public get isRefreshing(): boolean {
    return this._isRefreshing;
  }

  public get refreshTokenSubject(): BehaviorSubject<string | null> {
    return this._refreshTokenSubject;
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  constructor() {
  }

  initAuth(): Observable<User | null> {
    const token = this.getTokenFromStorage();
    if (token) {
      const userService = this.injector.get(UserService);
      
      return userService.getProfile().pipe(
        catchError((err) => {
          console.error('Session token is invalid, logging out.', err);
          this.logout();
          return of(null);
        })
      );
    }
    return of(null);
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http
      .post<LoginResponse>(`${this.API_BASE_URL}/login-user`, credentials)
      .pipe(
        tap((response: LoginResponse) => {
          localStorage.setItem('authToken', response.access_token);

          localStorage.setItem('refreshToken', response.refresh_token);
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

  refreshToken(): Observable<any> {
    if (this._isRefreshing) {
      return this._refreshTokenSubject;
    }

    this._isRefreshing = true;
    const refreshToken = this.getRefreshTokenFromStorage();

    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<LoginResponse>(
        `${this.API_BASE_URL}/refresh-token`, { refreshToken }
      )
      .pipe(
        tap((response: LoginResponse) => {
          this._isRefreshing = false;
          localStorage.setItem('authToken', response.access_token);
          this._refreshTokenSubject.next(response.access_token);
        }),
        catchError((err) => {
          this._isRefreshing = false;
          this.logout();
          return throwError(() => err);
        })
      );
  }

  register(request: RegisterRequest): Observable<User> {
    return this.http
      .post<User>(`${this.API_BASE_URL}/register-user`, request)
      .pipe(
        tap((response: User) => {
          console.log('Registration successful:', response);
        }),
        catchError((err) => {
          return throwError(() => err); 
        })
      );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('refreshToken');
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

  getRefreshTokenFromStorage(): string | null {
    return localStorage.getItem('refreshToken');
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