import {
  Component,
  input,
  Output,
  EventEmitter,
  computed,
  signal,
  inject,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import type { Report } from '../../../models/item-model';
import { ItemStatus } from '../../status-badge/status-badge';

@Component({
  selector: 'app-report-item-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './report-item-card.html',
  styleUrls: ['./report-item-card.scss'],
})
export class ReportItemCard {
  private elementRef = inject(ElementRef);
  report = input.required<Report>();
  currentUserId = input<number | null>(null);

  @Output() ticketClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();
  @Output() viewCodeClicked = new EventEmitter<void>();

  isMenuOpen = signal(false);
  
  userName = computed(() => {
    const r = this.report();
    return r.reporter_name || `User ${r.user_id}`;
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      this.isMenuOpen() &&
      !this.elementRef.nativeElement.contains(event.target)
    ) {
      this.isMenuOpen.set(false);
    }
  }

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

  getCodeButtonLabel(): string {
    const item = this.report();

    if (item.type === 'lost' || item.claim_code) {
        return 'View Ticket ID';
    }

    return 'View Reference Code';
  }

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

  onViewCode(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen.set(false);
    this.viewCodeClicked.emit();
  }
}