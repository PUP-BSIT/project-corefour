import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup
} from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { AuthService } from '../../../core/auth/auth-service';
import { ToastService } from '../../../core/services/toast-service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-forgot-pass-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './forgot-pass-page.html',
  styleUrls: ['./forgot-pass-page.scss']
})
export class ForgotPassPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  forgotPasswordForm: FormGroup;
  isLoading = false;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      const { email } = this.forgotPasswordForm.value;

      this.authService.forgotPassword(email).subscribe({
        next: (response) => {
          this.toastService
            .showSuccess('Email verified. Redirecting to reset page...');
          this.isLoading = false;

          this.router.navigate(['/reset-password'], {
              queryParams: { email: email } });
        },
        error: (err: HttpErrorResponse) => {
          const errorData = err.error as { error: string }; 
          this.toastService.showError(errorData.error || 'Email not found.');
          this.isLoading = false;
        }
      });
    } else {
      this.forgotPasswordForm.markAllAsTouched();
    }
  }
}