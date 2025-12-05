import { Component, input, Output, EventEmitter } from '@angular/core';
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
  items = input.required<Report[]>();
  currentUserId = input<number | null>(null);

  @Output() cardTicketClicked = new EventEmitter<Report>();
  @Output() cardEditClicked = new EventEmitter<Report>();
  @Output() cardDeleteClicked = new EventEmitter<Report>();
  @Output() cardViewCodeClicked = new EventEmitter<Report>();

  handleTicketClick(itemData: Report): void {
    this.cardTicketClicked.emit(itemData);
  }

  handleEditClick(itemData: Report): void {
    this.cardEditClicked.emit(itemData);
  }

  handleDeleteClick(itemData: Report): void {
    this.cardDeleteClicked.emit(itemData);
  }

  handleViewCodeClick(itemData: Report): void {
    this.cardViewCodeClicked.emit(itemData);
  }
}