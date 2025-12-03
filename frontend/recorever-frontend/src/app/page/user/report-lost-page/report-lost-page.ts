import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { ItemReportForm }
    from '../../../share-ui-blocks/item-report-form/item-report-form';
import { FinalReportSubmission, Report } from '../../../models/item-model';
import { ItemService } from '../../../core/services/item-service';

@Component({
  selector: 'app-report-lost-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ItemReportForm],
  standalone: true,
  imports: [CommonModule, RouterModule, ItemReportForm],
  templateUrl: './report-lost-page.html',
  styleUrls: ['./report-lost-page.scss']
  styleUrls: ['./report-lost-page.scss']
})
export class ReportLostPage {

  private router = inject(Router);
  private itemService = inject(ItemService);

  handleSubmission(data: FinalReportSubmission): void {
    this.itemService.createReport(data).pipe(
      tap((response: Report) => {
        console.log('Lost Report Submitted Successfully:', response);
        this.router.navigate(['/app/lost-items']);
      }),
      catchError(error => {
        console.error('Lost Report Submission Failed:', error);
        return of(null);
      })
    ).subscribe();
  }

  handleCancel(): void {
    this.router.navigate(['/app/lost-items']);
  }
}