import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
    return this.theme === 'lost' ? 'reported-lost.png' : 'reported-found.png';
  }

  onClick() {
    const route = this.theme === 'lost' ? '/user/report-lost-page' :
        '/user/report-found-page';

    this.router.navigate([route]);

    console.log(`Navigating to the ${this.theme} item report page at ${route}`);
  }
}