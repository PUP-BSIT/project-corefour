import { Component, inject, OnInit, signal } from '@angular/core';
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
export class ReportFoundPage implements OnInit {
  private router = inject(Router);
  private itemService = inject(ItemService);

  protected isSubmitting = signal<boolean>(false);
  protected submissionError = signal<string | null>(null);
  protected showReferenceModal = signal<boolean>(false);
  protected referenceCode = signal<string>('');
  protected submissionDate = signal<string>('');
  protected submittedReportId = signal<number | null>(null);
  protected isEditMode = signal<boolean>(false);
  protected pageTitle = signal<string>('Report Found Item');
  protected initialData = signal<Report | null>(null);

  ngOnInit(): void {
    const state = history.state;
    if (state && state.mode === 'EDIT' && state.data) {
      this.isEditMode.set(true);
      this.initialData.set(state.data as Report);
      this.pageTitle.set('Edit Report Found Item');
    }
  }

  handleSubmission(data: FinalReportSubmission & { files?: File[] }): void {
    const files: File[] = data.files ?? [];
    this.isSubmitting.set(true);
    this.submissionError.set(null);

    const request$ = this.isEditMode() 
      ? this.itemService.updateReport(data, files) 
      : this.itemService.submitFullReport(data, files);

    request$.pipe(
      tap((response: Report) => {
        if (this.isEditMode()) {
          this.router.navigate(['/app/found-items']);
          return;
        }
        
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
        this.submissionError.set('Submission failed. Please try again.');
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