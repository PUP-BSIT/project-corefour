import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ItemReportForm }
    from '../../../share-ui-blocks/item-report-form/item-report-form';
import { FinalReportSubmission } from '../../../models/item-model';

@Component({
  selector: 'app-report-found-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ItemReportForm],
  templateUrl: './report-found-page.html',
  styleUrls: ['./report-found-page.scss']
})
export class ReportFoundPage {

  private router = inject(Router);

  handleSubmission(data: FinalReportSubmission): void {
    console.log('Found Report Submitted:', data);
    this.router.navigate(['/app/found-items']);
  }

  handleCancel(): void {
    this.router.navigate(['/app/found-items']);
  }
}
