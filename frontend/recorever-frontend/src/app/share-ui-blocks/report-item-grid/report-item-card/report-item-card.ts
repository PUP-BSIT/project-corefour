import {
  Component,
  input,
  Output,
  EventEmitter,
  computed,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import type { Report } from '../../../models/item-model';
import { ItemStatus } from '../../status-badge/status-badge';
import { StatusBadge } from '../../status-badge/status-badge';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';

@Component({
  selector: 'app-report-item-card',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    StatusBadge,
    TimeAgoPipe,
  ],
  templateUrl: './report-item-card.html',
  styleUrls: ['./report-item-card.scss'],
})
export class ReportItemCard {
  report = input.required<Report>();
  currentUserId = input<number | null>(null);
  isUserProfilePage = input<boolean>(false);
  isAdmin = input<boolean>(false);

  @Output() cardClicked = new EventEmitter<void>();
  @Output() ticketClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();
  @Output() viewCodeClicked = new EventEmitter<void>();

  currentImageIndex = 0;

  shouldShowCodeAutomatically = computed(() => {
    const adminStatus = this.isAdmin();
    return adminStatus;
  });

  photoUrls = computed((): string[] => {
    const urls = this.report().photoUrls;
    return urls && urls.length > 0 ? urls : ['assets/temp-photo-item.png'];
  });

  hasMultipleImages = computed((): boolean => {
    return this.photoUrls().length > 1;
  });

  currentImageUrl = computed((): string => {
    return this.photoUrls()[this.currentImageIndex] ||
        'assets/temp-photo-item.png';
  });

  userName = computed((): string => {
    const r = this.report();
    if (this.isUserProfilePage()) {
      return r.type === 'lost' ? 'LOST' : 'FOUND';
    }
    return r.reporter_name || `User ${r.user_id}`;
  });

  isOwner = computed((): boolean => {
    return this.currentUserId() === this.report().user_id;
  });

  displayStatus = computed((): ItemStatus => {
    const s = this.report().status;
    if (s === 'approved' || s === 'matched') {
      return 'Verified';
    }
    return (s.charAt(0).toUpperCase() + s.slice(1)) as ItemStatus;
  });

  getCodeButtonLabel(): string {
    const item = this.report();
    return (item.type === 'lost' || item.claim_code)
      ? 'View Ticket ID'
      : 'View Reference Code';
  }

  referenceCodeValue = computed(() => {
    const r = this.report();
    return r.surrender_code || r.claim_code || 'N/A';
  });

  onTicketClick(): void {
    this.ticketClicked.emit();
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.editClicked.emit();
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.deleteClicked.emit();
  }

  onViewCode(event: Event): void {
    event.stopPropagation();
    this.viewCodeClicked.emit();
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    const urls = this.photoUrls();
    this.currentImageIndex = (this.currentImageIndex + 1) % urls.length;
  }

  previousImage(event: Event): void {
    event.stopPropagation();
    const urls = this.photoUrls();
    this.currentImageIndex = (this.currentImageIndex - 1 + urls.length)
        % urls.length;
  }

  onCardClick(): void {
    this.cardClicked.emit();
  }
}