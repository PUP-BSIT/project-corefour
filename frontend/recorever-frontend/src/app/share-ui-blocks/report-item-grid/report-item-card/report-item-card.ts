import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportItem } from '../../../models/item-model';

@Component({
  selector: 'app-report-item-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-item-card.html',
  styleUrl: './report-item-card.scss',
})

export class ReportItemCard {

  @Input() item: ReportItem = {
    id: 0,
    userInitials: 'A',
    userName: 'User Name',
    postDate: 'Date',
    title: 'Title',
    location: 'Location',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit,' +
        ' sed do eiusmod tempor',
  };

  @Output() ticketClicked = new EventEmitter<void>();

  onTicketClick(): void {
    this.ticketClicked.emit();
  }
}