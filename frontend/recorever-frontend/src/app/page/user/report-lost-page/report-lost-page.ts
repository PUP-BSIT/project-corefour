import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import {
  ItemReportForm
} from '../../../share-ui-blocks/item-report-form/item-report-form';
import { FinalReportSubmission, Report } from '../../../models/item-model';
import { ItemService } from '../../../core/services/item-service';
import {
  SuccessLostModal
} from '../../../modal/success-lost-modal/success-lost-modal';

@Component({
  selector: 'app-report-lost-page',
  standalone: true,
  imports: [RouterModule, ItemReportForm, SuccessLostModal],
  templateUrl: './report-lost-page.html',
  styleUrls: ['./report-lost-page.scss']
})
export class ReportLostPage implements OnInit {
  private router = inject(Router);
  private itemService = inject(ItemService);
  
  protected showSuccessModal = signal<boolean>(false);
  protected submissionError = signal<string | null>(null);
  protected isSubmitting = signal<boolean>(false);
  protected isEditMode = signal<boolean>(false);
  protected pageTitle = signal<string>('Report Lost Item');
  protected initialData = signal<Report | null>(null);

  ngOnInit(): void {
    const state = history.state;
    if (state && state.mode === 'EDIT' && state.data) {
      this.isEditMode.set(true);
      this.initialData.set(state.data as Report);
      this.pageTitle.set('Edit Report Lost Item');
    }
  }

  handleSubmission(data: FinalReportSubmission & { files?: File[] }): void {
    const files = data.files ?? [];
    this.isSubmitting.set(true);
    this.submissionError.set(null);

    const request$ = this.isEditMode() 
      ? this.itemService.updateReport(data, files) 
      : this.itemService.submitFullReport(data, files);

    request$.pipe(
      tap((response: Report) => {
        if (this.isEditMode()) {
          this.router.navigate(['/app/lost-items']);
          return;
        }
        this.showSuccessModal.set(true);
      }),
      catchError((error: HttpErrorResponse) => {
        this.submissionError.set('Submission failed. Please try again.');
        return EMPTY;
      }),
      finalize(() => this.isSubmitting.set(false))
    ).subscribe();
  }

  onViewReport(): void {
    this.showSuccessModal.set(false);
    this.router.navigate(['/app/profile']);
  }

  onSearchItems(): void {
    this.showSuccessModal.set(false);
    this.router.navigate(['/app/found-items']);
  }

  handleCancel(): void {
    this.router.navigate(['/app/lost-items']);
  }
}