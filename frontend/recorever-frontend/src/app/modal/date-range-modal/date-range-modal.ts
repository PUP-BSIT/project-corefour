import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-date-range-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './date-range-modal.html',
  styleUrl: './date-range-modal.scss'
})
export class DateRangeModal {
  private fb = inject(FormBuilder);

  @Output() confirm = new EventEmitter<{start: Date, end: Date}>();
  @Output() cancel = new EventEmitter<void>();

  dateForm = this.fb.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required]
  });

  onConfirm(): void {
    if (this.dateForm.valid) {
      const { startDate, endDate } = this.dateForm.value;

      if (startDate && endDate) {
        this.confirm.emit({
          start: new Date(startDate),
          end: new Date(endDate)
        });
      }
    } else {
      this.dateForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}