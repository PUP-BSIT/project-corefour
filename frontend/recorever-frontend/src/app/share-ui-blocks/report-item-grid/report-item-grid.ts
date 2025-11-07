import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportItemCard } from './report-item-card/report-item-card';

@Component({
  selector: 'app-report-item-grid',
  standalone: true,
  imports: [CommonModule, ReportItemCard],
  templateUrl: './report-item-grid.html',
  styleUrl: './report-item-grid.scss',
})
export class ReportItemGrid {

  @Input() items: any[] = [];

  @Output() cardTicketClicked = new EventEmitter<any>();

  handleTicketClick(itemData: any): void {
    this.cardTicketClicked.emit(itemData);
    console.log(`Ticket clicked for item: ${itemData.title}`);
  }
}