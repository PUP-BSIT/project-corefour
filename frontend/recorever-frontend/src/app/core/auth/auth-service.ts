import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject,
        Observable,
        tap,
        of,
        catchError,
        throwError,
        filter,
        take
} from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LoginRequest,
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

  private _refreshTokenSubject = new BehaviorSubject<boolean>(false);

  public get isRefreshing(): boolean {
    return this._isRefreshing;
  }

  public get refreshTokenSubject(): BehaviorSubject<boolean> { 
    return this._refreshTokenSubject;
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  constructor() {
  }

  initAuth(): Observable<User | null> {
    if (!this.getUserFromStorage()) {
        return of(null);
    }
    
    const userService = this.injector.get(UserService);

    return userService.getProfile().pipe(
      tap((user) => {
        this.updateCurrentUser(user);
      }),
      catchError((err) => {
        console.error('Session token is invalid, logging out.', err);
        this.logout();
        return of(null);
      })
    );
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http
      .post<User>(`${this.API_BASE_URL}/login-user`, credentials, { withCredentials: true }) 
      .pipe(
        tap((user: User) => {
          this.updateCurrentUser(user);
        }),
        catchError((err) => {
          throw err;
        })
      );
  }

  refreshToken(): Observable<any> {
    if (this._isRefreshing) {
      return this._refreshTokenSubject.pipe(filter(val => val), take(1));
    }

    this._isRefreshing = true;

    return this.http
      .post<User>(
        `${this.API_BASE_URL}/refresh-token`, 
        {}, 
        { withCredentials: true }
      )
      .pipe(
        tap((user: User) => {
          this._isRefreshing = false;
          this.updateCurrentUser(user);
          this._refreshTokenSubject.next(true);
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
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  public updateCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  isLoggedIn(): boolean {
    return !!this.getUserFromStorage(); 
  }

  isAdmin(): boolean {
    const user = this.getUserFromStorage();
    return !!user && user.role === 'admin';
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