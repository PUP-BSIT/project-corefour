import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, Params } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  showSuccess(
    message: string,
    actionLabel?: string,
    actionRoute?: string,
    queryParams?: Params
  ): void {
    const snackBarRef = this.snackBar.open(message, actionLabel, {
      duration: 5000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });

    if (actionRoute) {
      snackBarRef.onAction().subscribe(() => {
        this.router.navigate([actionRoute], { queryParams });
      });
    }
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}