import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemsTableComponent }
  from './items-table-component/items-table-component';
import { SearchBarComponent }
  from '../../../share-ui-blocks/search-bar/search-bar';

@Component({
  selector: 'app-report-status-page',
  standalone: true,
  imports: [CommonModule, ItemsTableComponent, SearchBarComponent],
  templateUrl: './report-status-page.html',
  styleUrls: ['./report-status-page.scss'],
})
export class ReportStatusPage {
  onSearchSubmit(query: string): void {
    console.log('Searching for:', query);
    // TODO: Implement actual search/filter logic here
  }
}