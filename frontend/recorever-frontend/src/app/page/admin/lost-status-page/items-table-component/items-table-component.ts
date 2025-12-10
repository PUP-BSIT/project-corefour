import { Component, input, EventEmitter, Output } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Report } from '../../../../models/item-model';
import { ActionMenuComponent } from './action-menu-component/action-menu-component';

@Component({
  selector: 'app-items-table-component',
  standalone: true,
  imports: [CommonModule, ActionMenuComponent, TitleCasePipe],
  templateUrl: './items-table-component.html',
  styleUrls: ['./items-table-component.scss'],
})
export class ItemsTableComponent {
  reports = input.required<Report[]>();
  isLoading = input<boolean>(false);
  isError = input<boolean>(false);

  @Output() viewDetails = new EventEmitter<Report>();

  onViewDetails(report: Report): void {
    this.viewDetails.emit(report);
  }

  getReferenceNumber(report: Report): string | number {
      if (report.type === 'found' && report.surrender_code) {
        return report.surrender_code;
      }
      return ''; 
    }

  getDisplayStatus(status: Report['status']): string {
    if (status === 'approved') {
      return 'Verified';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getDisplayStatusClass(status: Report['status']): string {
    if (status === 'approved') {
      return 'verified';
    }
    return status;
  }
}