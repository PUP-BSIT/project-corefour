import { Component } from '@angular/core';
// UPDATED PATH: Uses a relative path to the child component
import { LoginForm, LoginFormValue } from './login-form/login-form';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginForm],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginPage {
  isLoading = false;

  onLogin(credentials: LoginFormValue): void {
    this.isLoading = true;
    console.log('Form submitted:', credentials);
    // TODO(YourName, YourName): Add auth logic
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }
}