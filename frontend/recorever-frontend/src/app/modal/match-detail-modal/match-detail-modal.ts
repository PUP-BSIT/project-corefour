import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ItemDetailModal } from '../item-detail-modal/item-detail-modal';
import { Report } from '../../models/item-model';
import { ItemService } from '../../core/services/item-service';
import { switchMap, tap, of } from 'rxjs';

@Component({
  selector: 'app-match-detail-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, ItemDetailModal],
  templateUrl: './match-detail-modal.html',
  styleUrl: './match-detail-modal.scss',
})
export class MatchDetailModal implements OnInit {
  private itemService = inject(ItemService);

  @Input({ required: true }) report!: Report;
  @Input() currentUserId: number | null = null;
  @Output() close = new EventEmitter<void>();

  matchedItem = signal<Report | null>(null);
  isLoading = signal<boolean>(true);

  step: 'confirm' | 'success' = 'confirm';
  showItemDetails = false;

  ngOnInit(): void {
    this.fetchMatchedItem();
  }

  fetchMatchedItem(): void {
    this.isLoading.set(true);

    this.itemService.getMatchForReport(this.report.report_id).pipe(
      switchMap(match => {
        if (!match) {
          throw new Error('Match not found');
        }

        const otherId = match.lost_report_id === this.report.report_id
          ? match.found_report_id
          : match.lost_report_id;

        return this.itemService.getReportById(otherId);
      }),
      tap(matchedReport => {
        this.matchedItem.set(matchedReport);
        this.isLoading.set(false);
      })
    ).subscribe({
      error: (err) => {
        console.error('Failed to load matched item', err);
        this.isLoading.set(false);
      }
    });
  }

  get matchedImageUrl(): string | null {
    const item = this.matchedItem();
    if (!item) return null;

    if (item.photoUrls && item.photoUrls.length > 0) {
      return item.photoUrls[0];
    }
    if (item.images && item.images.length > 0) {
      return item.images[0].imageUrl;
    }
    return null;
  }

  onConfirmOwnership(): void {
    this.step = 'success';
  }

  onItemClick(): void {
    this.showItemDetails = true;
  }

  onItemDetailClose(): void {
    this.showItemDetails = false;
  }

  onClose(): void {
    this.close.emit();
  }
}