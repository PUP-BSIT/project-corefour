import { HttpInterceptorFn,
        HttpRequest,
        HttpHandlerFn,
        HttpEvent,
        HttpErrorResponse 
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth-service';
import { environment } from '../../../environments/environment';
import { Observable, 
        throwError, 
        catchError, 
        switchMap, 
        filter, 
        take 
} from 'rxjs';
import type { LoginResponse } from '../../models/auth-model';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getTokenFromStorage();
  const isApiRequest = req.url.startsWith(environment.apiUrl);

  if (token && isApiRequest) {
    req = addAuthToken(req, token);
  }

  return next(req).pipe(
    catchError(error => {
      if (
        error instanceof HttpErrorResponse && 
        error.status === 401 &&
        !req.url.includes('/refresh-token')
      ) {
        return handle401Error(req, next, authService);
      } else {
        return throwError(() => error);
      }
    })
  );
};

function addAuthToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<any>> {

  if (authService.isRefreshing) {
    return authService.refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap((newToken) => {
        return next(addAuthToken(req, newToken as string));
      })
    );
  } else {
    return authService.refreshToken().pipe(
      switchMap((response: LoginResponse) => {
        return next(addAuthToken(req, response.access_token));
      }),
      catchError((err) => {
        authService.logout();
        return throwError(() => err);
      })
    );
  }
}