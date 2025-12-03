import { Component, signal, OnInit, ApplicationRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth-service';
import { filter, first, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('recorever-frontend');
  protected readonly isLoading = signal(true);

  constructor(
    private auth: AuthService,
    private appRef: ApplicationRef
  ) {}

  ngOnInit(): void {
    this.auth.initAuth()
      .pipe(
        switchMap(() => this.appRef.isStable),
        filter((stable: boolean) => stable),
        first()
      )
      .subscribe({
        next: () => {
          setTimeout(() => {
            this.isLoading.set(false);
          }, 500);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }
}