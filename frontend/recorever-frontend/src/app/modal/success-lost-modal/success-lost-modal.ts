import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-success-lost-modal',
  standalone: true,
  imports: [],
  templateUrl: './success-lost-modal.html',
  styleUrls: ['./success-lost-modal.scss']
})
export class SuccessLostModal {
  @Output() close = new EventEmitter<void>();
  @Output() viewReport = new EventEmitter<void>();

  onSearchItems(): void {
    this.close.emit();
  }

  onViewReportClick(): void {
    this.viewReport.emit();
  }
}