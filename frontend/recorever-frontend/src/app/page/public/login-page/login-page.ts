import { Component, inject, ChangeDetectorRef } from '@angular/core'; //
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { LoginForm } from './login-form/login-form';
import { LoginRequest } from '../../../models/auth-model';
import { User } from '../../../models/user-model';
import { AuthService } from '../../../core/auth/auth-service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginForm],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  hasLoginError = false;

  onLogin(credentials: LoginRequest): void {
    this.isLoading = true;
    this.hasLoginError = false;

    this.authService.login(credentials)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (user: User) => {
          if (user.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/app']);
          }
        },
        error: (err) => {
          this.hasLoginError = true;
          console.error('Login failed:', err);
          this.cdr.detectChanges();
        },
      });
  }

  onClearError(): void {
    this.hasLoginError = false;
  }
}