import {
  Component,
  input,
  Output,
  EventEmitter,
  computed,
  signal,
  inject,
  effect,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import type { Report } from '../../../models/item-model';
import type { User } from '../../../models/user-model';
import { ItemStatus } from '../../status-badge/status-badge';
import { UserService } from '../../../core/services/user-service';

@Component({
  selector: 'app-report-item-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './report-item-card.html',
  styleUrl: './report-item-card.scss',
})
export class ReportItemCard {
  private userService = inject(UserService);

  report = input.required<Report>();
  currentUserId = input<number | null>(null);

  @Output() ticketClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();

  isMenuOpen = signal(false);
  userName = signal<string>('Loading...');

  constructor() {
    effect(() => {
      const userId = this.report().user_id;
      if (userId) {
        this.fetchUserName(userId);
      }
    });
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

  private fetchUserName(userId: number): void {
    this.userService.getUserById(userId).subscribe({
      next: (user: User) => {
        this.userName.set(user.name || `User ${userId}`);
      },
      error: () => {
        this.userName.set(`User ${userId}`);
      },
    });
  }

  onTicketClick(): void {
    // TODO: Implement ticket/claim logic
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