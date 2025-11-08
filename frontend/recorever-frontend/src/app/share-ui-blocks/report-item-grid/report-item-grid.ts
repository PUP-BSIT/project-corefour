import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportItemCard } from './report-item-card/report-item-card';

type ReportItem = {
  id: string | number;
  userInitials: string;
  userName: string;
  postDate: string;
  title: string;
  location: string;
  description: string;
};

@Component({
  selector: 'app-report-item-grid',
  standalone: true,
  imports: [CommonModule, ReportItemCard],
  templateUrl: './report-item-grid.html',
  styleUrl: './report-item-grid.scss',
})
export class ReportItemGrid {

  @Input() items: ReportItem[] = [];

  @Output() cardTicketClicked = new EventEmitter<ReportItem>();

  handleTicketClick(itemData: ReportItem): void {
    this.cardTicketClicked.emit(itemData);
  }
}