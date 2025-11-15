import { Component, Input, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import type { Report } from '../../../models/item-model';
import {
  StatusBadge,
  ItemStatus,
} from '../../status-badge/status-badge';

@Component({
  selector: 'app-report-item-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './report-item-card.html',
  styleUrl: './report-item-card.scss',
})
export class ReportItemCard {
  @Input({ required: true }) report!: Report;


  displayStatus = computed<ItemStatus>(() => {
    switch (this.report.status) {
      case 'pending':
        return 'Pending';
      case 'claimed':
        return 'Claimed';
      case 'approved':
      case 'matched':
        return 'Verified';
      default:
        return 'Pending';
    }
  });

  // TODO: Implement user fetching to display name
  // For now, userInitials and userName are hardcoded.

  onTicketClick(): void {
    // TODO: Implement ticket/claim logic
    console.log('Ticket clicked for report:', this.report.report_id);
  }
}