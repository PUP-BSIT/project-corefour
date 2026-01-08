import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RegisterRequest } from '../../../../models/auth-model';
import { UserService } from '../../../../core/services/user-service';

type PasswordFieldType = 'password' | 'text';
type PasswordStrength = 'none' | 'weak' | 'medium' | 'strong';

export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const isWhitespace = (control.value || '').toString().indexOf(' ') >= 0;
    return isWhitespace ? { hasSpaces: true } : null;
  };
}

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
    }

    if (matchingControl.hasError('passwordMismatch')) {
      matchingControl.setErrors(null);
    }
    return null;
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

    if (hasNumber && hasSpecialChar) {
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
export class RegisterFormComponent implements OnChanges {
  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  @Input() isLoading = false;
  @Input() errorMessage: string | null = null;
  @Output() formSubmit = new EventEmitter<RegisterRequest>();

  passwordFieldType: PasswordFieldType = 'password';
  confirmPasswordFieldType: PasswordFieldType = 'password';
  passwordStrength: PasswordStrength = 'none';

  registerForm = this.formBuilder.group(
    {
      name: [
        '',
        {
          validators: [
            Validators.required,
            noWhitespaceValidator(),
          ],
          asyncValidators: [
            this.userService.uniqueValidator('name', '')
          ],
        },
      ],

      phone_number: [
        '',
        {
          validators: [
            Validators.required,
            Validators.pattern(/^(\+63|0)9\d{9}$/),
          ],
          asyncValidators: [
            this.userService.uniqueValidator('phone_number', '')
          ],
        },
      ],

      email: [
        '',
        {
          validators: [Validators.required, Validators.email],
          asyncValidators: [
            this.userService.uniqueValidator('email', '')
          ],
        },
      ],

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

      confirmPassword: [
        '',
        {
          validators: [Validators.required],
        },
      ],
    },
    {
      validators: [passwordMatchValidator('password', 'confirmPassword')],
    }
  );

  constructor() {
    this.registerForm.get('password')?.valueChanges.subscribe((value) => {
      this.updatePasswordStrength(value || '');
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isLoading'] || changes['errorMessage']) {
      this.cdr.detectChanges();
    }
  }

  get name(): AbstractControl | null {
    return this.registerForm.get('name');
  }
  get phone_number(): AbstractControl | null {
    return this.registerForm.get('phone_number');
  }
  get email(): AbstractControl | null {
    return this.registerForm.get('email');
  }
  get password(): AbstractControl | null {
    return this.registerForm.get('password');
  }
  get confirmPassword(): AbstractControl | null {
    return this.registerForm.get('confirmPassword');
  }

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
    this.errorMessage = null;
    if (this.registerForm.valid) {
      this.formSubmit.emit(this.registerForm.getRawValue() as RegisterRequest);
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}