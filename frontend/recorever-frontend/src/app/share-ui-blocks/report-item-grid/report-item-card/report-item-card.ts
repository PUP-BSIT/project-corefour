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
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, map, distinctUntilChanged, catchError, of } from 'rxjs';
import type { Report } from '../../../models/item-model';
import { ItemStatus } from '../../status-badge/status-badge';
import { UserService } from '../../../core/services/user-service';

@Component({
  selector: 'app-report-item-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './report-item-card.html',
  styleUrls: ['./report-item-card.scss'],
})
export class ReportItemCard {
  private userService = inject(UserService);
  private elementRef = inject(ElementRef);

  report = input.required<Report>();
  currentUserId = input<number | null>(null);

  @Output() ticketClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();
  @Output() viewCodeClicked = new EventEmitter<void>();

  isMenuOpen = signal(false);

  private report$ = toObservable(this.report);
  
  private userName$ = this.report$.pipe(
    map(r => r.user_id),
    distinctUntilChanged(),
    switchMap(id => {
        if (!id) return of('Unknown User');
        return this.userService.getUserById(id).pipe(
            map(u => u.name || `User ${id}`),
            catchError(() => of(`User ${id}`))
        );
    })
  );

  userName = toSignal(this.userName$, { initialValue: 'Loading...' });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isMenuOpen() && !this.elementRef.nativeElement
        .contains(event.target)) { this.isMenuOpen.set(false);
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