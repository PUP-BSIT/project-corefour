import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, timer, map, catchError, switchMap, of } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth-service';
import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';

import type { User, ChangePasswordRequest, UniqueCheckResponse } from '../../models/user-model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private API_BASE_URL = environment.apiUrl;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private uniquenessCache = new Map<string, Observable<boolean>>();

  currentUser$ = this.authService.currentUser$;

  getProfile(): Observable<User> {
    return this.http
      .get<User>(`${this.API_BASE_URL}/get-user-data`)
      .pipe(
        tap((user) => {
          this.authService.updateCurrentUser(user);
        })
      );
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.API_BASE_URL}/user/${userId}`);
  }

  searchUsers(query: string): Observable<User[]> {
    if (!query || query.length < 2) {
      return of([]);
    }
    const params = new HttpParams().set('query', query);
    return this.http
      .get<User[]>(`${this.API_BASE_URL}/users/search`, { params })
      .pipe(catchError(() => of([])));
  }

  checkUniqueness(
    field: 'email' | 'phone_number' | 'name',
    value: string
  ): Observable<boolean> {
    const key = `${field}:${value}`;

    if (this.uniquenessCache.has(key)) {
      return this.uniquenessCache.get(key)!;
    }

    const params = new HttpParams().set('field', field).set('value', value);

    const request$ = this.http
      .get<UniqueCheckResponse>(`${this.API_BASE_URL}/check-unique`, {
        params,
      })
      .pipe(
        map((response) => response.isUnique),
        catchError(() => of(true)),
        shareReplay(1)
      );

    this.uniquenessCache.set(key, request$);

    return request$;
  }

  uniqueValidator(
    field: 'email' | 'phone_number' | 'name',
    initialValue: string
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value === initialValue) {
        return of(null);
      }

      return timer(500).pipe(
        switchMap(() => this.checkUniqueness(field, control.value)),
        map((isUnique) => (isUnique ? null : { notUnique: true }))
      );
    };
  }

  updateProfile(user: User, file: File | null): Observable<User> {
    const formData = new FormData();
    formData.append('name', user.name);
    formData.append('phone_number', user.phone_number);
    formData.append('email', user.email);

    if (file) {
      formData.append('profile_picture_file', file);
    }

    return this.http
      .put<User>(`${this.API_BASE_URL}/update-user-data`, formData)
      .pipe(
        tap((updatedUser) => {
          this.authService.updateCurrentUser(updatedUser);
        })
      );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(
      `${this.API_BASE_URL}/change-password`,
      request
    );
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/delete-account`);
  }
}