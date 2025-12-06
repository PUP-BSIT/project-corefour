import {
  Component,
  EventEmitter,
  Output,
  ChangeDetectorRef,
  inject,
  Renderer2,
  input
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-codes-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './codes-modal.html',
  styleUrl: './codes-modal.scss',
})
export class CodesModal {
  private cdr = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);

  title = input.required<string>();
  code = input.required<string | number>();

  copyLabel = 'Copy';
  isCopied = false;

  @Output() close = new EventEmitter<void>();

  onDone(): void {
    this.close.emit();
  }

  copyToClipboard(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const textToCopy = this.code().toString();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => this.showCopiedState())
        .catch(err => {
          console.error('Async copy failed, trying fallback', err);
          this.fallbackCopy(textToCopy);
        });
    } else {
      this.fallbackCopy(textToCopy);
    }
  }

  private fallbackCopy(text: string): void {
    const textArea = this.renderer.createElement('textarea');

    this.renderer.setProperty(textArea, 'value', text);
    this.renderer.setStyle(textArea, 'position', 'fixed');
    this.renderer.setStyle(textArea, 'left', '-9999px');
    this.renderer.setStyle(textArea, 'top', '0');
    this.renderer.setAttribute(textArea, 'readonly', '');

    this.renderer.appendChild(this.document.body, textArea);

    textArea.focus();
    textArea.select();

    try {
      const successful = this.document.execCommand('copy');
      if (successful) {
        this.showCopiedState();
      } else {
        console.error('Fallback copy unsuccessful');
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    this.renderer.removeChild(this.document.body, textArea);
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