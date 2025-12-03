import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { ItemReportForm }
    from '../../../share-ui-blocks/item-report-form/item-report-form';
import { FinalReportSubmission, Report } from '../../../models/item-model';
import { ItemService } from '../../../core/services/item-service';

@Component({
  selector: 'app-report-found-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ItemReportForm],
  standalone: true,
  imports: [CommonModule, RouterModule, ItemReportForm],
  templateUrl: './report-found-page.html',
  styleUrls: ['./report-found-page.scss']
  styleUrls: ['./report-found-page.scss']
})
export class ReportFoundPage {

  private router = inject(Router);
  private itemService = inject(ItemService);

  handleSubmission(data: FinalReportSubmission): void {
    this.itemService.createReport(data).pipe(
      tap((response: Report) => {
        console.log('Found Report Submitted Successfully:', response);
        this.router.navigate(['/app/found-items']);
      }),
      catchError(error => {
        console.error('Found Report Submission Failed:', error);
        return of(null);
      })
    ).subscribe();
  }

  handleCancel(): void {
    this.router.navigate(['/app/found-items']);
  }
}