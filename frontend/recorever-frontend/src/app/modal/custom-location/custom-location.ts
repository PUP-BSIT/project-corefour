import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-custom-location',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './custom-location.html',
  styleUrl: './custom-location.scss',
})
export class CustomLocation {

  private fb = inject(FormBuilder);

  @Output() locationSelected = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  protected maxChars = 50;

  protected locationForm = this.fb.group({
    customLocation: [
      '',
      {
        validators: [Validators.required, Validators.maxLength(this.maxChars)],
        updateOn: 'change',
      }
    ]
  });

  onGo(): void {
    if (this.locationForm.valid) {
      this.locationSelected.emit(this.locationForm.controls.customLocation.value!);
    } else {
      this.locationForm.markAllAsTouched();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}