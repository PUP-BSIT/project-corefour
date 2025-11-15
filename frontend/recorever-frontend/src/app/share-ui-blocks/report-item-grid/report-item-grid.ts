import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportItemCard } from './report-item-card/report-item-card';
import { Report } from '../../models/item-model';

@Component({
  selector: 'app-report-item-grid',
  standalone: true,
  imports: [CommonModule, ReportItemCard],
  templateUrl: './report-item-grid.html',
  styleUrl: './report-item-grid.scss',
})
export class ReportItemGrid {

  @Input() items: Report[] = [];

  @Output() cardTicketClicked = new EventEmitter<Report>();

  handleTicketClick(itemData: Report): void {
    this.cardTicketClicked.emit(itemData);
  }
}