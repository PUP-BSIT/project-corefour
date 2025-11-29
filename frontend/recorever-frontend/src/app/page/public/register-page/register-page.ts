import { ChangeDetectionStrategy,
         ChangeDetectorRef,
         Component,
         inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterFormComponent } from './register-form/register-form';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { RegisterRequest } from '../../../models/auth-model';
import { AppRoutePaths } from '../../../app.routes';
import { switchMap } from 'rxjs';

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
  private cdr = inject(ChangeDetectorRef);

  isLoading: boolean = false;
  errorMessage: string | null = null;

  onRegisterSubmit(request: RegisterRequest): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.authService.register(request).pipe(
      switchMap(() => this.authService.login(request))
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Registration & Login Success:', response);
        
        this.router.navigate([AppRoutePaths.PROFILE], { 
          queryParams: { registered: true } 
        });
        
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration Failed:', error);

        if (error.error && error.error.error) {
          this.errorMessage = error.error.error;
        } else {
          this.errorMessage = `
            Registration failed. Check your connection or data.
          `;
        }
        this.cdr.markForCheck();
      },
    });
  }
}