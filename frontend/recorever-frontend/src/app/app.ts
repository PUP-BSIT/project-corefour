import { Component, signal, OnInit, AfterViewInit, Renderer2, Inject, ApplicationRef }
    from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth-service';
import { DOCUMENT } from '@angular/common';
import { filter, first } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})

export class App implements OnInit, AfterViewInit {
  protected readonly title = signal('recorever-frontend');

  constructor(
    private auth: AuthService,
    private renderer: Renderer2,
    private appRef: ApplicationRef,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.auth.initAuth().subscribe();
  }

  ngAfterViewInit(): void {
    this.appRef.isStable
      .pipe(
        filter(stable => stable),
        first()
      )
      .subscribe(() => {
        this.hideLoadingScreen();
      });
  }

  private hideLoadingScreen(): void {
    const loadingScreen = this.document.getElementById('app-loading-screen');

    if (loadingScreen) {
      this.renderer.addClass(loadingScreen, 'fade-out');

      setTimeout(() => {
        this.renderer.removeChild(this.document.body, loadingScreen);
      }, 1000);
    }
  }
}