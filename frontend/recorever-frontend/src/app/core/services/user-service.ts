import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, timer, map, catchError, switchMap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth-service';
import type { User } from '../../models/user-model';
import { AbstractControl,
        AsyncValidatorFn,
        ValidationErrors
} from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private API_BASE_URL = environment.apiUrl;

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_BASE_URL}/get-user-data`)
    .pipe(
      tap(user => {
        this.authService.updateCurrentUser(user);
      })
    );
  }

  checkUniqueness(
    field: 'email' | 'phone_number' | 'name',
    value: string
  ): Observable<boolean> {
    const params = new HttpParams()
      .set('field', field)
      .set('value', value);
      
    return this.http
      .get<{ isUnique: boolean }>(
        `${this.API_BASE_URL}/check-unique`, { params }
      )
      .pipe(
        map(response => response.isUnique),
        catchError(() => of(false))
      );
  }

  uniqueValidator(
    field: 'email' | 'phone_number' | 'name',
    initialValue: string
  ): AsyncValidatorFn {
    return (
      control: AbstractControl
    ): Observable<ValidationErrors | null> => {
      if (!control.value || control.value === initialValue) {
        return of(null);
      }

      return timer(500).pipe(
        switchMap(() => this.checkUniqueness(field, control.value)),
        map(isUnique => (isUnique ? null : { notUnique: true }))
      );
    };
  }

  updateProfile(user: User, file: File | null): Observable<User> {
    const formData = new FormData();
    
    formData.append('name', user.name);
    formData.append('phone_number', user.phone_number);
    formData.append('email', user.email);

    if (file) {
      // TODO(Durante, Stephanie): Handle profile picture file upload
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