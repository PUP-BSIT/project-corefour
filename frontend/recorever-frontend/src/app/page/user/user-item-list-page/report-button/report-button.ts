import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ReportButtonTheme = 'lost' | 'found';

@Component({
  selector: 'app-report-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-button.html',
  styleUrl: './report-button.scss',
})
export class ReportButton {
  @Input() theme: ReportButtonTheme = 'lost';
  @Input() label = 'Report';

  @Output() buttonClicked = new EventEmitter<void>();

  get iconName(): string {
    return this.theme === 'lost' ? 'report-lost.png' : 'report-found.png';
  }

  onClick() {
    this.buttonClicked.emit();
  }
}