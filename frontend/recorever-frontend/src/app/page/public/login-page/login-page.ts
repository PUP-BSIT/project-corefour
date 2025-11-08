import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginForm} from './login-form/login-form';
import { LoginRequest } from '../../../models/auth-model';
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

  isLoading = false;
  hasLoginError = false;

  onLogin(credentials: LoginRequest): void {
    this.isLoading = true;
    this.hasLoginError = false;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        // SUCCESS!
        this.isLoading = false;
        this.router.navigate(['/app']);
      },
      error: (err) => {
        // FAILURE!
        this.isLoading = false;
        this.hasLoginError = true; // This will make the error message appear
        console.error('Login failed:', err);
      },
    });
  }
}