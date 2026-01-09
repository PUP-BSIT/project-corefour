import { Component, input, Output, EventEmitter, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { Report } from '../../models/item-model';
import { ItemStatus } from '../../share-ui-blocks/status-badge/status-badge';
import { StatusBadge } from '../../share-ui-blocks/status-badge/status-badge';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { CodesModal } from '../codes-modal/codes-modal';

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
    MatTooltipModule,
    StatusBadge,
    TimeAgoPipe,
    CodesModal,
  ],
  templateUrl: './item-detail-modal.html',
  styleUrls: ['./item-detail-modal.scss'],
})
export class ItemDetailModal {
  private router = inject(Router);

  item = input.required<Report>();
  userProfilePicture = input<string | null>(null);
  currentUserId = input<number | null>(null);
  isArchiveView = input<boolean>(false);
  isAdmin = input<boolean>(false);

  @Output() close = new EventEmitter<void>();
  @Output() viewTicket = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();
  @Output() viewCodeClicked = new EventEmitter<void>();
  @Output() unarchiveClicked = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<string>();

  public isDropdownOpen = signal<boolean>(false);
  showClaimModal = false;

  // Preserved dropdown options for Manage Lost Items
  protected readonly STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Verified' },
    { value: 'rejected', label: 'Rejected' }
  ];

  protected currentImageIndex = signal<number>(0);

  isEditable = computed((): boolean => {
    const status = this.item().status;
    return status === 'pending';
  });

  isRemovable = computed((): boolean => {
    return this.item().type === 'lost';
  });

  removeTooltip = computed((): string => {
    return !this.isRemovable()
      ? 'Found item reports are protected and cannot be removed directly.'
      : 'Remove this report';
  });

  photoUrls = computed((): string[] => {
    const report = this.item();
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

    const url = urls[this.currentImageIndex()];

    if (url && url.startsWith('http')) {
      return url.replace('http://', 'https://');
    }

    const secureBaseUrl = environment.apiUrl.replace('http://', 'https://');
    return `${secureBaseUrl}/image/download/${url}`;
  });

  displayStatus = computed((): ItemStatus => {
    const s = this.item().status;
    if (s === 'approved' || s === 'matched') {
      return 'Verified';
    }
    if (s === 'resolved') {
      return 'Resolved';
    }
    return (s.charAt(0).toUpperCase() + s.slice(1)) as ItemStatus;
  });

  isOwner = computed((): boolean => {
    return this.currentUserId() === this.item().user_id;
  });

  referenceCodeValue = computed((): string => {
    const r = this.item();
    return r.surrender_code || r.claim_code || 'N/A';
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

  navigateToProfile(): void {
    const userId = this.item().user_id;
    if (userId) {
      this.onClose();
      this.router.navigate(['/app/profile', userId]);
    }
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    const urls = this.photoUrls();
    this.currentImageIndex.update(index => (index + 1) % urls.length);
  }

  previousImage(event: Event): void {
    event.stopPropagation();
    const urls = this.photoUrls();
    this.currentImageIndex
        .update(index => (index - 1 + urls.length) % urls.length);
  }

  onClose(): void {
    this.close.emit();
  }

  onViewTicket(): void {
    this.showClaimModal = true;
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

  onUnarchive(): void {
    this.unarchiveClicked.emit();
  }

  protected toggleDropdown(event: Event): void {
    event.stopPropagation();
    if (this.isArchiveView()) return;
    this.isDropdownOpen.update(v => !v);
  }

  protected closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  protected onStatusOptionClick(status: string): void {
    if (this.isArchiveView()) return;

    this.statusChanged.emit(status);
    this.closeDropdown();
  }

  canShowUnarchive = computed((): boolean => {
    return this.isArchiveView() && this.item().status !== 'resolved';
  });

  protected isStatusDisabled(status: string): boolean {
    return false;
  }

  protected getOptionTooltip(status: string): string {
    return '';
  }
}