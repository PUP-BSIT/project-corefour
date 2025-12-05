import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { ItemReportForm }
    from '../../../share-ui-blocks/item-report-form/item-report-form';
import { FinalReportSubmission, Report } from '../../../models/item-model';
import { ItemService } from '../../../core/services/item-service';
import { CodesModal } from '../../../modal/codes-modal/codes-modal';

type ReportWithCodes = Report & { surrender_code: string | null };

@Component({
  selector: 'app-report-found-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ItemReportForm, CodesModal],
  templateUrl: './report-found-page.html',
  styleUrls: ['./report-found-page.scss']
})
export class ReportFoundPage {

  private router = inject(Router);
  private itemService = inject(ItemService);
  protected showReferenceModal = signal(false);
  protected referenceCode = signal('');
  protected submissionDate = signal('');

  handleSubmission(data: FinalReportSubmission): void {
    this.itemService.createReport(data).pipe(
      tap((response: ReportWithCodes) => {
        console.log('Found Report Submitted Successfully:', response);

        if (response.surrender_code) {
          this.referenceCode.set(response.surrender_code);
          this.submissionDate.set(new Date().toLocaleString());
          this.showReferenceModal.set(true);
        } else {
          this.router.navigate(['/app/found-items']);
        }
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

  onModalClose(): void {
    this.showReferenceModal.set(false);
    this.router.navigate(['/app/found-items']);
  }
}