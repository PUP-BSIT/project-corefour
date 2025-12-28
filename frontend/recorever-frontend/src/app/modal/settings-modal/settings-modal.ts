import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  ReactiveFormsModule, 
  Validators 
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ConfirmationModal } from '../confirmation-modal/confirmation-modal';

type SettingsView = 'MENU' | 'CHANGE_PASSWORD' | 'DELETE_ACCOUNT';

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
    ConfirmationModal // reusing existing component
  ],
  templateUrl: './settings-modal.html',
  styleUrl: './settings-modal.scss'
})
export class SettingsModal {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SettingsModal>);

  protected readonly currentView = signal<SettingsView>('MENU');
  protected readonly hideOldPassword = signal<boolean>(true);
  protected readonly hideNewPassword = signal<boolean>(true);
  protected readonly hideConfirmPassword = signal<boolean>(true);

  protected readonly passwordForm = this.fb.group({
    oldPassword: ['', {
      validators: [Validators.required],
      updateOn: 'change'
    }],
    newPassword: ['', {
      validators: [Validators.required, Validators.minLength(8)],
      updateOn: 'change'
    }],
    confirmPassword: ['', {
      validators: [Validators.required],
      updateOn: 'change'
    }]
  });

  protected toggleView(view: SettingsView): void {
    this.currentView.set(view);
  }

  protected togglePasswordVisibility(field: 'old' | 'new' | 'confirm'): void {
    if (field === 'old') this.hideOldPassword.update(val => !val);
    if (field === 'new') this.hideNewPassword.update(val => !val);
    if (field === 'confirm') this.hideConfirmPassword.update(val => !val);
  }

  protected onSubmitPassword(): void {
    if (this.passwordForm.valid) {
      // TODO(Durante, Stephanie): Implement password change service integration
      console.log('Password change requested');
      this.dialogRef.close();
    }
  }

  protected onDeleteAccountConfirm(): void {
    // TODO(Durante, Stephanie): Implement delete account service integration
    console.log('Delete account confirmed');
    this.dialogRef.close();
  }

  protected close(): void {
    this.dialogRef.close();
  }
}