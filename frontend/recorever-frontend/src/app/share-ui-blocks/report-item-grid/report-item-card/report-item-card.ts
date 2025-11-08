import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

type ReportItem = {
  userInitials: string;
  userName: string;
  postDate: string;
  title: string;
  location: string;
  description: string;
}

@Component({
  selector: 'app-report-item-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-item-card.html',
  styleUrl: './report-item-card.scss',
})
export class ReportItemCard {

  @Input() item: ReportItem = {
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