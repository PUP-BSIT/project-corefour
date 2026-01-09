import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Report } from '../../models/item-model';

@Component({
  selector: 'app-match-detail-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './match-detail-modal.html',
  styleUrl: './match-detail-modal.scss',
})
export class MatchDetailModal {
  @Input({ required: true }) report!: Report;
  @Output() close = new EventEmitter<void>();

  step: 'confirm' | 'success' = 'confirm';

  get imageUrl(): string | null {
    if (this.report.photoUrls && this.report.photoUrls.length > 0) {
      return this.report.photoUrls[0];
    }
    if (this.report.images && this.report.images.length > 0) {
      return this.report.images[0].imageUrl;
    }
    return null;
  }

  onConfirmOwnership(): void {
    this.step = 'success';
  }

  onClose(): void {
    this.close.emit();
  }
}