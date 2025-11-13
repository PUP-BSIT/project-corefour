import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterFormComponent } from './register-form/register-form';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { RegisterRequest } from '../../../models/auth-model';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RegisterFormComponent],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private router = inject(Router);
  private authService = inject(AuthService);

  isLoading: boolean = false;
  errorMessage: string | null = null;

  onRegisterSubmit(request: RegisterRequest): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.authService.register(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Registration Success:', response);

        this.router.navigate(['/login'], { queryParams: { registered: true } });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration Failed:', error);

        if (error.error && error.error.error) {
          this.errorMessage = error.error.error;
        } else {
          this.errorMessage = 'Registration failed. Check your connection or data.';
        }
      },
    });
  }
}