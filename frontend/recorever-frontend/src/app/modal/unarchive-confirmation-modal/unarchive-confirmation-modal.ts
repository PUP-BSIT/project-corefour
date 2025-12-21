import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unarchive-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unarchive-confirmation-modal.html',
  styleUrl: './unarchive-confirmation-modal.scss'
})
export class UnarchiveConfirmationModal {
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}