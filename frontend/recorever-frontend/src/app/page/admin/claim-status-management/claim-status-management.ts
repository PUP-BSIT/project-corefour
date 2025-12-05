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
import { ClaimService } from '../../../core/services/claim-service';
import { Claim } from '../../../models/claim-model';
import {
  SearchBarComponent
} from '../../../share-ui-blocks/search-bar/search-bar';

type SortOption = 'all' | 'az' | 'date';

@Component({
  selector: 'app-claim-status-management',
  standalone: true,
  imports: [CommonModule, RouterModule, SearchBarComponent, DatePipe],
  templateUrl: './claim-status-management.html',
  styleUrl: './claim-status-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimStatusManagement implements OnInit {
  private claimService = inject(ClaimService);

  protected claims = signal<Claim[]>([]);
  protected searchQuery = signal<string>('');
  protected currentSort = signal<SortOption>('all');
  protected isLoading = signal<boolean>(true);

  protected filteredClaims = computed(() => {
    let data = this.claims();
    const query = this.searchQuery().toLowerCase();
    const sortType = this.currentSort();

    if (query) {
      data = data.filter((claim) =>
        claim.item_name.toLowerCase().includes(query) ||
        claim.claim_id.toString().includes(query) ||
        claim.proof_description.toLowerCase().includes(query)
      );
    }

    return data.sort((a, b) => {
      if (sortType === 'az') {
        return a.item_name.localeCompare(b.item_name);
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

  private loadClaims(): void {
    this.isLoading.set(true);
    this.claimService.getAllClaims().subscribe({
      next: (data) => {
        this.claims.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load claims', err);
        this.isLoading.set(false);
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
    console.log(`View details for claim ID: ${claimId}`);
  }
}