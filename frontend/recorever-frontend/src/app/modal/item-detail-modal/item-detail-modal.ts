import { Component, input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import type { Report } from '../../models/item-model';
import { ItemStatus } from '../../share-ui-blocks/status-badge/status-badge';
import { StatusBadge } from '../../share-ui-blocks/status-badge/status-badge';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-item-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    StatusBadge,
    TimeAgoPipe,
  ],
  templateUrl: './item-detail-modal.html',
  styleUrls: ['./item-detail-modal.scss'],
})
export class ItemDetailModal {
  item = input.required<Report>();
  userProfilePicture = input<string | null>(null);
  currentUserId = input<number | null>(null);

  @Output() close = new EventEmitter<void>();
  @Output() viewTicket = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();
  @Output() viewCodeClicked = new EventEmitter<void>();

  currentImageIndex = 0;

  photoUrls = computed((): string[] => {
    const urls = this.item().photoUrls;
    return urls && urls.length > 0 ? urls : ['assets/temp-photo-item.png'];
  });

  hasMultipleImages = computed((): boolean => {
    return this.photoUrls().length > 1;
  });

  currentImageUrl = computed((): string => {
    return this.photoUrls()[this.currentImageIndex] ||
        'assets/temp-photo-item.png';
  });

  displayStatus = computed((): ItemStatus => {
    const s = this.item().status;
    if (s === 'approved' || s === 'matched') {
      return 'Verified';
    }
    return (s.charAt(0).toUpperCase() + s.slice(1)) as ItemStatus;
  });

  isOwner = computed((): boolean => {
    return this.currentUserId() === this.item().user_id;
  });

  getUserName(): string {
    const report = this.item();
    return report.reporter_name || `User ${report.user_id}`;
  }

  getUserProfilePicture(): string {
    return this.userProfilePicture() || 'assets/profile-avatar.png';
  }

  getCodeButtonLabel(): string {
    const item = this.item();
    return (item.type === 'lost' || item.claim_code)
      ? 'View Ticket ID'
      : 'View Reference Code';
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

  onClose(): void {
    this.close.emit();
  }

  onViewTicket(): void {
    this.viewTicket.emit();
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
}