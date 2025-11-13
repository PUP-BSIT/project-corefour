import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportButton }
    from '../../user/user-item-list-page/report-button/report-button';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, ReportButton],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss',
})
export class Homepage {

  private router = inject(Router);

  navigateToLost(): void {
    this.router.navigate(['/app/lost-items']);
  }

  navigateToFound(): void {
    this.router.navigate(['/app/found-items']);
  }
}