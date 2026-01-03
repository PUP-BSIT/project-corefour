import {
  Component,
  EventEmitter,
  Output,
  ChangeDetectorRef,
  inject,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-codes-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './codes-modal.html',
  styleUrl: './codes-modal.scss',
})
export class CodesModal {
  private cdr = inject(ChangeDetectorRef);

  title = input.required<string>();
  code = input.required<string | number>();
  subtext = input<string | number>();
  showViewReportButton = input<boolean>(false);

  copyLabel = 'Copy';
  isCopied = false;

  @Output() close = new EventEmitter<void>();
  @Output() viewReport = new EventEmitter<void>();

  onDone(): void {
    this.close.emit();
  }

  onViewReport(): void {
    this.viewReport.emit();
  }

  copyToClipboard(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const textToCopy = this.code().toString();

    navigator.clipboard.writeText(textToCopy)
      .then(() => this.showCopiedState())
      .catch((err) => {
        console.error('Copy failed', err);
      });
  }

  private showCopiedState(): void {
    this.copyLabel = 'Copied!';
    this.isCopied = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.copyLabel = 'Copy';
      this.isCopied = false;
      this.cdr.detectChanges();
    }, 2000);
  }
}