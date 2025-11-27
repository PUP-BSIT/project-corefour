import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoginRequest } from '../../../../models/auth-model';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
})
export class LoginForm implements OnInit {
  private fb = inject(FormBuilder);

  @Input() loginError = false;
  @Input() isSubmitting = false;
  @Output() loginSubmit = new EventEmitter<LoginRequest>();
  @Output() clearError = new EventEmitter<void>();

  isPasswordVisible = false;

  loginForm = this.fb.group({
    email: ['', {
      validators: [Validators.required, Validators.email],
      updateOn: 'change'
    }],
    password: ['', {
      validators: [Validators.required],
      updateOn: 'change'
    }],
  });

  ngOnInit(): void {
    this.loginForm.valueChanges.subscribe(() => {
      if (this.loginError) {
        this.clearError.emit();
      }
    });
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  submitForm(): void {
    if (this.loginForm.valid) {
      this.loginSubmit.emit(
        this.loginForm.getRawValue() as LoginRequest
      );
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}