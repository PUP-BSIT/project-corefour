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
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../../environments/environment';

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
    MatTooltipModule,
  ],
  templateUrl: './report-item-card.html',
  styleUrls: ['./report-item-card.scss'],
})
export class ReportItemCard {
  report = input.required<Report>();
  currentUserId = input<number | null>(null);
  isUserProfilePage = input<boolean>(false);
  isArchiveView = input<boolean>(false);
  isAdmin = input<boolean>(false);

  @Output() cardClicked = new EventEmitter<void>();
  @Output() ticketClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();
  @Output() viewCodeClicked = new EventEmitter<void>();
  @Output() unarchiveClicked = new EventEmitter<void>();

  currentImageIndex = 0;

  isRemovable = computed((): boolean => {
    return this.report().type === 'lost';
  });

  removeTooltip = computed((): string => {
    return !this.isRemovable() 
      ? 'Found item reports are protected and cannot be removed directly.' 
      : 'Remove this report';
  });

  shouldShowCodeAutomatically = computed(() => {
    const adminStatus = this.isAdmin();
    return adminStatus;
  });

  photoUrls = computed((): string[] => {
    const report = this.report();
    if (report.images && report.images.length > 0) {
      return report.images.map(img => img.imageUrl);
    }

    if (report.photoUrls && report.photoUrls.length > 0) {
      return report.photoUrls;
    }
    return [];
  });

  hasMultipleImages = computed((): boolean => {
    return this.photoUrls().length > 1;
  });

  currentImageUrl = computed((): string => {
    const urls = this.photoUrls();

    if (urls.length === 0) {
      return 'assets/temp-photo-item.png';
    }

    const url = urls[this.currentImageIndex];

    if (url && url.startsWith('http')) {
      return url;
    }
  
    return `${environment.apiUrl}/image/download/${url}`;
  });

  displayStatus = computed((): ItemStatus => {
    const s = this.report().status;
    if (s === 'approved' || s === 'matched') {
      return 'Verified';
    }
    return (s.charAt(0).toUpperCase() + s.slice(1)) as ItemStatus;
  });

  userName = computed((): string => {
    if (this.isUserProfilePage()) {
      return this.report().type === 'lost' ? 'LOST' : 'FOUND';
    }
    const report = this.report();
    return report.reporter_name || `User ${report.user_id}`;
  });

  isOwner = computed((): boolean => {
    return this.currentUserId() === this.report().user_id;
  });

  isEditable = computed((): boolean => {
    const status = this.report().status;
    return status === 'pending';
  });

  getCodeButtonLabel(): string {
    const report = this.report();
    return (report.type === 'lost' || report.claim_code)
      ? 'View Ticket ID'
      : 'View Reference Code';
  }

  referenceCodeValue = computed(() => {
    const r = this.report();
    return r.surrender_code || r.claim_code || 'N/A';
  });

  nextImage(event: Event): void {
    event.stopPropagation();
    const urls = this.photoUrls();
    this.currentImageIndex = (this.currentImageIndex + 1) % urls.length;
  }

  previousImage(event: Event): void {
    event.stopPropagation();
    const urls = this.photoUrls();
    this.currentImageIndex =
        (this.currentImageIndex - 1 + urls.length) % urls.length;
  }

  onCardClick(): void {
    this.cardClicked.emit();
  }

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

  onUnarchive(event: Event): void {
    event.stopPropagation();
    this.unarchiveClicked.emit();
  }
}