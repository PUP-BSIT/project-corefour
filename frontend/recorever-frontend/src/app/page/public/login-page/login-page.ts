import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginForm} from './login-form/login-form';
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

  isLoading = false;
  hasLoginError = false;

  onLogin(credentials: LoginRequest): void {
    this.isLoading = true;
    this.hasLoginError = false;

    this.authService.login(credentials).subscribe({
      next: (user: User) => {
        this.isLoading = false;
        if (user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/app']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.hasLoginError = true;
        console.error('Login failed:', err);
      },
    });
  }
}