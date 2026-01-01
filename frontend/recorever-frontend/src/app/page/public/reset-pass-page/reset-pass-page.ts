import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ReactiveFormsModule, 
  FormBuilder, 
  Validators, 
  FormGroup, 
  AbstractControl, 
  ValidationErrors 
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/auth/auth-service';
import { ToastService } from '../../../core/services/toast-service';

@Component({
  selector: 'app-reset-pass-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, 
    MatInputModule, MatFormFieldModule, MatIconModule, MatButtonModule
  ],
  templateUrl: './reset-pass-page.html',
  styleUrls: ['./reset-pass-page.scss']
})
export class ResetPassPage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  resetPasswordForm!: FormGroup;
  email: string = '';
  
  currentView = signal<'FORM' | 'SUCCESS'>('FORM');
  isLoading = signal<boolean>(false);
  isPasswordFocused = signal<boolean>(false);
  passwordStrength = signal<'none' | 'weak' | 'medium' | 'strong'>('none');
  
  hidePassword = signal<boolean>(true);
  hideConfirmPassword = signal<boolean>(true);

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    if (!this.email) { this.router.navigate(['/forgot-password']); return; }

    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8), 
        this.complexityValidator 
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: [this.passwordMatchValidator],
      updateOn: 'change' 
    });

    this.resetPasswordForm.get('newPassword')?.valueChanges.subscribe(val => {
      this.updatePasswordStrength(val || '');
    });
  }

  complexityValidator(control: AbstractControl): ValidationErrors | null {
    const value: string = control.value || '';
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const hasCapital = /[A-Z]/.test(value);
    
    if (!hasNumber || !hasSpecialChar || !hasCapital) {
      return { 
        complexity: { 
          needsNumber: !hasNumber, 
          needsSpecialChar: !hasSpecialChar,
          needsCapital: !hasCapital
        } 
      };
    }
    return null;
  }

  updatePasswordStrength(value: string): void {
    if (!value) { this.passwordStrength.set('none'); return; }
    let score = 0;
    if (value.length >= 8) score++;
    if (/\d/.test(value)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;

    if (score <= 2) this.passwordStrength.set('weak');
    else if (score <= 4) this.passwordStrength.set('medium');
    else this.passwordStrength.set('strong');
  }

  passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
    const formGroup = g as FormGroup;
    const pass = formGroup.get('newPassword')?.value;
    const confirm = formGroup.get('confirmPassword')?.value;
    const match = pass === confirm;

    if (!match && formGroup.get('confirmPassword')?.touched) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    }
    return match ? null : { passwordMismatch: true };
  }

onSubmit(): void {
    if (this.resetPasswordForm.valid) {
      this.isLoading.set(true);
      
      const email = this.email;
      const newPassword = this.resetPasswordForm.value.newPassword;

      this.authService.resetPasswordPublic(email, newPassword).subscribe({
        next: (res: { success: boolean; message: string }) => {
          this.isLoading.set(false);
          
          if (res.success) {
            this.currentView.set('SUCCESS');
          } else {
            this.toastService.showError(res.message || 'Reset failed.');
          }
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          const errorMessage = err.error?.message || 'Connection error.';
          this.toastService.showError(errorMessage);
        }
      });
    } else {
      this.resetPasswordForm.markAllAsTouched();
    }
  }
}