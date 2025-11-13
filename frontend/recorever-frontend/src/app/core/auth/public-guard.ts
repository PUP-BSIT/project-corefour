import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth-service';

export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    if (authService.isAdmin()) {
      router.navigate(['/admin']);
    } else {
      router.navigate(['/app']);
    }
    return false;
  }

  return true;
};