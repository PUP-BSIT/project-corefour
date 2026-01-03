import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, EMPTY, finalize, tap } from 'rxjs';

import {
  ItemReportForm
} from '../../../share-ui-blocks/item-report-form/item-report-form';
import {
  FinalReportSubmission,
  Report
} from '../../../models/item-model';
import { ItemService } from '../../../core/services/item-service';
import { CodesModal } from '../../../modal/codes-modal/codes-modal';

@Component({
  selector: 'app-report-found-page',
  standalone: true,
  imports: [RouterModule, ItemReportForm, CodesModal],
  templateUrl: './report-found-page.html',
  styleUrls: ['./report-found-page.scss']
})
export class ReportFoundPage {
  private router = inject(Router);
  private itemService = inject(ItemService);

  protected isSubmitting = signal(false);
  protected submissionError = signal<string | null>(null);
  protected showReferenceModal = signal(false);
  protected referenceCode = signal('');
  protected submissionDate = signal('');
  protected submittedReportId = signal<number | null>(null);

  handleSubmission(
      data: FinalReportSubmission & { files?: File[] }
  ): void {
    const files = data.files ?? [];
    this.isSubmitting.set(true);
    this.submissionError.set(null);

    this.itemService.submitFullReport(data, files).pipe(
        tap((response: Report) => {
          this.submittedReportId.set(response.report_id);

          if (response?.surrender_code) {
            this.referenceCode.set(response.surrender_code);
            this.submissionDate.set(new Date().toLocaleString());
            this.showReferenceModal.set(true);
          } else {
            this.router.navigate(['/app/found-items']);
          }
        }),
        catchError((err: HttpErrorResponse) => {
          this.submissionError.set(
              'Submission failed. Please try again.'
          );
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false))
    ).subscribe();
  }

  handleCancel(): void {
    this.router.navigate(['/app/found-items']);
  }

  onModalClose(): void {
    this.showReferenceModal.set(false);
    this.router.navigate(['/app/found-items']);
  }

  onViewReport(): void {
    this.showReferenceModal.set(false);
    this.router.navigate(['/app/profile']);
  }
}