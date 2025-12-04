import {
  Component,
  input,
  Output,
  EventEmitter,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import type { Report } from '../../../models/item-model';
import { ItemStatus } from '../../status-badge/status-badge';

@Component({
  selector: 'app-report-item-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './report-item-card.html',
  styleUrl: './report-item-card.scss',
})
export class ReportItemCard {
  report = input.required<Report>();
  currentUserId = input<number | null>(null);

  @Output() ticketClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();

  isMenuOpen = signal(false);

  userName = computed(() => {
    return this.report().reporter_name || `User ${this.report().user_id}`;
  });

  isOwner = computed(() => {
    return this.currentUserId() === this.report().user_id;
  });

  displayStatus = computed<ItemStatus>(() => {
    switch (this.report().status) {
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

  onTicketClick(): void {
    this.ticketClicked.emit();
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen.update((v) => !v);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen.set(false);
    this.editClicked.emit();
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen.set(false);
    this.deleteClicked.emit();
  }

  onBackdropClick(): void {
    this.isMenuOpen.set(false);
  }
}