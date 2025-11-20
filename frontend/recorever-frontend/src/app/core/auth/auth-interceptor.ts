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

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isApiRequest = req.url.startsWith(environment.apiUrl);

  if (isApiRequest) {
    req = req.clone({
      withCredentials: true
    });
  }

  return next(req).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse) {
        
        const isAuthError = (error.status === 401 || error.status === 403);
        const isRefreshUrl = req.url.includes('/refresh-token');

        if (isAuthError && !isRefreshUrl) {
            return handle401Error(req, next, authService);

        }

        return throwError(() => error);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<any>> {

  if (authService.isRefreshing) {
    return authService.refreshTokenSubject.pipe(
      filter(val => val),
      take(1),
      switchMap(() => {
        return next(req.clone()); 
      })
    );
  } else {
    return authService.refreshToken().pipe(
      switchMap(() => {
        return next(req.clone());
      }),
      catchError((err) => {
        authService.logout();
        return throwError(() => err);
      })
    );
  }
}