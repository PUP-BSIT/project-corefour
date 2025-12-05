import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Report } from '../../../../../models/item-model';

@Component({
  selector: 'app-action-menu-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-menu-component.html',
  styleUrls: ['./action-menu-component.scss'],
})
export class ActionMenuComponent {
  @Input({ required: true }) report!: Report;

  @Output() viewDetails = new EventEmitter<Report>();

  onViewDetails(): void {
    this.viewDetails.emit(this.report);
  }
}