import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { ClaimService } from '../../../core/services/claim-service';
import { ItemService } from '../../../core/services/item-service';
import { Claim } from '../../../models/claim-model';
import {
  SearchBarComponent
} from '../../../share-ui-blocks/search-bar/search-bar';
import {
  ClaimFormModal
} from '../../../modal/claim-form-modal/claim-form-modal';

type SortOption = 'all' | 'az' | 'date';

@Component({
  selector: 'app-claim-status-management',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    SearchBarComponent, 
    DatePipe, 
    ClaimFormModal
  ],
  templateUrl: './claim-status-management.html',
  styleUrl: './claim-status-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimStatusManagement implements OnInit {
  private claimService = inject(ClaimService);
  private itemService = inject(ItemService);

  // Guideline: Take advantage of TS inference type (no <Claim[]> needed if empty array implies it, 
  // but kept for array clarity. Removed <string> and <boolean> for primitives). 
  protected claims = signal<Claim[]>([]);
  protected searchQuery = signal(''); 
  protected currentSort = signal<SortOption>('all');
  protected isLoading = signal(true);
  protected selectedClaimId = signal<number | null>(null);

  protected filteredClaims = computed(() => {
    let data = this.claims();
    const query = this.searchQuery().toLowerCase();
    const sortType = this.currentSort();

    if (query) {
      data = data.filter((claim) =>
        (claim.item_name || '').toLowerCase().includes(query) ||
        claim.claim_id.toString().includes(query) ||
        (claim.admin_remarks || '').toLowerCase().includes(query)
      );
    }

    return [...data].sort((a, b) => {
      if (sortType === 'az') {
        return (a.item_name || '').localeCompare(b.item_name || '');
      }
      if (sortType === 'date') {
        return new Date(b.created_at).getTime() -
               new Date(a.created_at).getTime();
      }
      return 0;
    });
  });

  ngOnInit(): void {
    this.loadClaims();
  }

  // Guideline: Stop using Vanilla JS way (async/await) 
  protected loadClaims(): void {
    this.isLoading.set(true);

    // Guideline: Use pipe() and RXJS operators 
    forkJoin({
      claims: this.claimService.getAllClaims(),
      reports: this.itemService.getReports({ type: 'found' })
    }).pipe(
      map(({ claims, reports }) => {
        return claims.map(claim => {
          const matchingReport = reports.find(
            r => r.report_id === claim.report_id
          );
          return {
            ...claim,
            item_name: matchingReport ? matchingReport.item_name :'Unknown Item'
          };
        });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (combinedClaims) => {
        this.claims.set(combinedClaims);
      },
      error: (err) => {
        console.error('Failed to load claims', err);
      }
    });
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  protected setSort(option: SortOption): void {
    this.currentSort.set(option);
  }

  protected onViewDetails(claimId: number): void {
    this.selectedClaimId.set(claimId);
  }

  protected onCloseModal(): void {
    this.selectedClaimId.set(null);
  }

  protected onStatusChanged(): void {
    this.loadClaims();
  }
}