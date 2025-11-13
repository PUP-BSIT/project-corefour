import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppRoutePaths } from '../../../../app.routes';

export type ReportButtonTheme = 'lost' | 'found';

@Component({
  selector: 'app-report-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-button.html',
  styleUrl: './report-button.scss',
})
export class ReportButton {

  private router = inject(Router);

  @Input() theme: ReportButtonTheme = 'lost';

  @Input() label = 'Report';

  get iconName(): string {
    return this.theme === 'lost' ? 'report-lost.png' : 'report-found.png';
  }

  onClick() {
    const route = this.theme === 'lost' ? AppRoutePaths.REPORT_LOST :
        AppRoutePaths.REPORT_FOUND;

    this.router.navigate([route]);
  }
}