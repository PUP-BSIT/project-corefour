import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from '../../../share-ui-blocks/search-bar/search-bar';
import { ReportButton } from '../user-item-list-page/report-button/report-button';

type FilterType = 'all' | 'az' | 'date' | 'location';

@Component({
  selector: 'app-report-found-page',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, ReportButton],
  templateUrl: './report-found-page.html',
  styleUrl: './report-found-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFoundPage {
  activeFilter = signal<FilterType>('all');

  selectFilter(filter: FilterType): void {
    this.activeFilter.set(filter);
  }

  onSearchSubmit(query: string): void {
    // TODO: Implement search logic
    console.log('Search query submitted:', query);
  }
}