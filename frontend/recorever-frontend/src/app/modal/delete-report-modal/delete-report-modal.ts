import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-report-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-report-modal.html',
  styleUrl: './delete-report-modal.scss'
})
export class DeleteReportModal {
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}