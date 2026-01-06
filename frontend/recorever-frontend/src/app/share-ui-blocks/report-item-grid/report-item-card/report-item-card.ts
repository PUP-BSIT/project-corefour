import {
  Component,
  input,
  Output,
  EventEmitter,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { Router } from '@angular/router';
import { CodesModal } from '../../../modal/codes-modal/codes-modal';

@Component({
  selector: 'app-report-item-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    StatusBadge,
    TimeAgoPipe,
    MatTooltipModule,
    CodesModal,
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

  isHighlighted = input<boolean>(false);

  private router = inject(Router);

  @Output() cardClicked = new EventEmitter<void>();
  @Output() ticketClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();
  @Output() viewCodeClicked = new EventEmitter<void>();
  @Output() unarchiveClicked = new EventEmitter<void>();

  activeModalMode = signal<'ticket' | 'finder' | null>(null);

  modalTitle = computed((): string => {
    return 'Item Reference Details';
  });

  modalDescription = computed((): string => {
    if (this.activeModalMode() === 'ticket') {
      return 'To claim this item, please present this code to the ' +
             'administrator. You will be asked to provide proof of ' +
             'ownership (e.g., describing the contents or showing an ID)';
    }
    return 'Use this code when surrendering the item to the administrator. ' +
           'This confirms you are the authorized finder';
  });

  protected currentImageIndex = signal<number>(0);

  isRemovable = computed((): boolean => {
    return this.report().type === 'lost';
  });

  removeTooltip = computed((): string => {
    return !this.isRemovable()
      ? 'Found item reports are protected and cannot be removed directly.'
      : 'Remove this report';
  });

  shouldShowCodeAutomatically = computed((): boolean => {
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

    const url = urls[this.currentImageIndex()];

    if (url && url.startsWith('http')) {
      return url.replace('http://', 'https://');
    }

    const secureBaseUrl = environment.apiUrl.replace('http://', 'https://');
    return `${secureBaseUrl}/image/download/${url}`;
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

  public getCodeButtonLabel(): string {
    const report = this.report();
    return report.type === 'lost' || report.claim_code
      ? 'View Ticket ID'
      : 'View Reference Code';
  }

  referenceCodeValue = computed((): string => {
    const r = this.report();
    return r.surrender_code || r.claim_code || 'N/A';
  });

  public nextImage(event: Event): void {
    event.stopPropagation();
    const urls = this.photoUrls();
    this.currentImageIndex.update(index => (index + 1) % urls.length);
  }

  public previousImage(event: Event): void {
    event.stopPropagation();
    const urls = this.photoUrls();
    this.currentImageIndex
      .update(index => (index - 1 + urls.length) % urls.length);
  }

  public onCardClick(): void {
    this.cardClicked.emit();
  }

  public onTicketClick(): void {
    this.activeModalMode.set('ticket');
  }

  public onEdit(event: Event): void {

    const reportData = this.report();
    const path = reportData.type === 'lost'
      ? '/app/report-lost'
      : '/app/report-found';

    this.router.navigate([path], {
      state: {
        data: reportData,
        mode: 'EDIT'
      }
    });

    this.editClicked.emit();
  }

  public onDelete(event: Event): void {
    this.deleteClicked.emit();
  }

  public onViewCode(event: Event): void {
    this.activeModalMode.set('finder');
  }

  public onUnarchive(event: Event): void {
    event.stopPropagation();
    this.unarchiveClicked.emit();
  }

  public onCloseModal(): void {
    this.activeModalMode.set(null);
  }
}