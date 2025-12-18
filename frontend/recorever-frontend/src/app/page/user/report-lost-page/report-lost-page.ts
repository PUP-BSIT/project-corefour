import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { ItemReportForm }
    from '../../../share-ui-blocks/item-report-form/item-report-form';
import { FinalReportSubmission, Report } from '../../../models/item-model';
import { ItemService } from '../../../core/services/item-service';

@Component({
  selector: 'app-report-lost-page',
  standalone: true,
  imports: [RouterModule, ItemReportForm],
  templateUrl: './report-lost-page.html',
  styleUrls: ['./report-lost-page.scss']
})
export class ReportLostPage {
  private router = inject(Router);
  private itemService = inject(ItemService);

  protected submissionError = signal<string | null>(null);
  protected isSubmitting = signal(false);

  handleSubmission(
      data: FinalReportSubmission & { files?: File[] }
  ): void {
    const files = data.files ?? [];
    this.isSubmitting.set(true);
    this.submissionError.set(null);

    this.itemService.submitFullReport(data, files).pipe(
      tap((response: Report) => {
        this.router.navigate(['/app/lost-items']);
      }),
      catchError((error: HttpErrorResponse) => {
        this.submissionError.set(
            'Submission failed. Please try again.'
        );
        return EMPTY;
      }),
      finalize(() => this.isSubmitting.set(false))
    ).subscribe();
  }

  handleCancel(): void {
    this.router.navigate(['/app/lost-items']);
  }
}