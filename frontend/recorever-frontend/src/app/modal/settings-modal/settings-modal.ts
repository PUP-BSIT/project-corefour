import { Component, inject, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { 
  FormBuilder, 
  ReactiveFormsModule, 
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { take, switchMap } from 'rxjs';
import { ConfirmationModal } from '../confirmation-modal/confirmation-modal';
import { UserService } from '../../core/services/user-service';
import { AuthService } from '../../core/auth/auth-service';
import { ToastService } from '../../core/services/toast-service';
import type { ChangePasswordRequest } from '../../models/user-model';

type SettingsView = 'MENU' | 'CHANGE_PASSWORD' | 'DELETE_ACCOUNT' | 
                    'PASSWORD_CHANGE_SUCCESS';
type PasswordStrength = 'none' | 'weak' | 'medium' | 'strong';

function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    return (hasNumber && hasSpecialChar) 
      ? null 
      : { 
          passwordStrength: { 
            hasNumber: !hasNumber, 
            hasSpecialChar: !hasSpecialChar 
          } 
        };
  };
}

function passwordMatchValidator(
  controlName: string, 
  matchingControlName: string
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const control = group.get(controlName);
    const matchingControl = group.get(matchingControlName);

    if (!control || !matchingControl) return null;

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (matchingControl.hasError('passwordMismatch')) {
        const errors = { ...matchingControl.errors };
        delete errors['passwordMismatch'];
        matchingControl.setErrors(
            Object.keys(errors).length ? errors : null
        );
    }
    return null;
  };
}

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    ConfirmationModal,
    NgClass
  ],
  templateUrl: './settings-modal.html',
  styleUrl: './settings-modal.scss'
})
export class SettingsModal {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SettingsModal>);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  protected readonly currentView = signal<SettingsView>('MENU');
  protected readonly hideOldPassword = signal(true);
  protected readonly hideNewPassword = signal(true);
  protected readonly hideConfirmPassword = signal(true);
  
  protected passwordStrength = signal<PasswordStrength>('none');
  protected errorMessage = signal<string | null>(null);
  protected isSubmitting = signal(false);
  protected isPasswordFocused = signal(false);

  protected readonly passwordForm = this.fb.group({
    oldPassword: ['', {
      validators: [Validators.required],
      updateOn: 'change'
    }],
    newPassword: ['', {
      validators: [
        Validators.required, 
        Validators.minLength(8), 
        strongPasswordValidator()
      ],
      updateOn: 'change'
    }],
    confirmPassword: ['', {
      validators: [Validators.required],
      updateOn: 'change'
    }]
  }, { 
    validators: [passwordMatchValidator('newPassword', 'confirmPassword')],
    updateOn: 'change' 
  });

  constructor() {
    this.passwordForm.controls.newPassword.valueChanges.subscribe(val => {
      this.updatePasswordStrength(val || '');
    });

    this.passwordForm.valueChanges.subscribe(() => {
      if (this.errorMessage()) this.errorMessage.set(null);
    });
  }

  protected toggleView(view: SettingsView): void {
    this.errorMessage.set(null);
    this.currentView.set(view);
  }

  protected togglePasswordVisibility(field: 'old' | 'new' | 'confirm'): void {
    if (field === 'old') this.hideOldPassword.update(v => !v);
    if (field === 'new') this.hideNewPassword.update(v => !v);
    if (field === 'confirm') this.hideConfirmPassword.update(v => !v);
  }

  protected onPasswordFocus(): void {
    this.isPasswordFocused.set(true);
  }

  protected onPasswordBlur(): void {
    this.isPasswordFocused.set(false);
  }

  private updatePasswordStrength(value: string): void {
    if (!value) {
      this.passwordStrength.set('none');
      return;
    }

    let score = 0;
    if (value.length >= 8) score++;
    if (/\d/.test(value)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;

    if (score <= 2) this.passwordStrength.set('weak');
    else if (score <= 4) this.passwordStrength.set('medium');
    else this.passwordStrength.set('strong');
  }

  protected onSubmitPassword(): void {
    if (this.passwordForm.valid) {
      this.isSubmitting.set(true);
      this.errorMessage.set(null);

      const request: ChangePasswordRequest = {
        oldPassword: this.passwordForm.controls.oldPassword.value ?? '',
        newPassword: this.passwordForm.controls.newPassword.value ?? ''
      };

      this.userService.changePassword(request)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.currentView.set('PASSWORD_CHANGE_SUCCESS');
          },
          error: (err) => {
            console.error('Password change failed', err);
            this.isSubmitting.set(false);
            if (err.status === 401 || err.status === 400) {
              this.errorMessage.set('Incorrect old password or invalid data.');
            } else {
              this.errorMessage.set('An error occurred. Please try again.');
            }
          }
        });
    } else {
      this.passwordForm.markAllAsTouched();
    }
  }

  protected onDeleteAccountConfirm(): void {
    this.userService.deleteAccount()
      .pipe(
        take(1),
        switchMap(() => {
          this.dialogRef.close();
          this.toastService.showSuccess('Account deleted successfully');
          return this.authService.logout();
        })
      )
      .subscribe({
        error: (err) => {
          console.error('Account deletion failed', err);
        }
      });
  }

  protected close(): void {
    this.dialogRef.close();
  }
}