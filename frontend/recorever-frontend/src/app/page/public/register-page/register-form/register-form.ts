import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

type PasswordFieldType = 'password' | 'text';
type PasswordStrength = 'none' | 'weak' | 'medium' | 'strong';

export function passwordMatchValidator(
  controlName: string,
  matchingControlName: string
): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const control = formGroup.get(controlName);
    const matchingControl = formGroup.get(matchingControlName);

    if (!control || !matchingControl) {
      return null;
    }

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (matchingControl.hasError('passwordMismatch')) {
        matchingControl.setErrors(null);
      }
      return null;
    }
  };
}

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const passwordValid = hasNumber && hasSpecialChar;

    if (passwordValid) {
      return null;
    }

    return {
      passwordStrength: {
        hasNumber: !hasNumber,
        hasSpecialChar: !hasSpecialChar,
      },
    };
  };
}

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './register-form.html',
  styleUrl: './register-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterFormComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);

  registerForm!: FormGroup;

  passwordFieldType: PasswordFieldType = 'password';
  confirmPasswordFieldType: PasswordFieldType = 'password';
  passwordStrength: PasswordStrength = 'none';

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group(
      {
        name: ['', { validators: [Validators.required] }],
        phone: [
          '',
          {
            validators: [
              Validators.required,
              Validators.pattern(/^(\+63|0)9\d{9}$/),
            ],
          },
        ],
        email: ['', { validators: [Validators.required, Validators.email] }],
        password: [
          '',
          {
            validators: [
              Validators.required,
              Validators.minLength(8),
              strongPasswordValidator(),
            ],
          },
        ],
        confirmPassword: ['', { validators: [Validators.required] }],
      },
      {
        validators: [passwordMatchValidator('password', 'confirmPassword')],
      }
    );

    this.password?.valueChanges.subscribe((value: string | null) => {
      this.updatePasswordStrength(value || '');
    });
  }

  get name() {
    return this.registerForm.get('name');
  }
  get phone() {
    return this.registerForm.get('phone');
  }
  get email() {
    return this.registerForm.get('email');
  }
  get password() {
    return this.registerForm.get('password');
  }
  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  // Method to Calculate Strength
  private updatePasswordStrength(value: string): void {
    if (!value) {
      this.passwordStrength = 'none';
      return;
    }

    let score = 0;
    if (value.length >= 8) score++;
    if (/\d/.test(value)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;

    if (score <= 2) {
      this.passwordStrength = 'weak';
    } else if (score <= 4) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType =
      this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordFieldType =
      this.confirmPasswordFieldType === 'password' ? 'text' : 'password';
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      // TODO: Implement registration call to auth service
      console.log('Form Submitted!', this.registerForm.value);

    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}