import { Component, signal, OnInit, AfterViewInit, Inject }
    from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth-service';
import { DOCUMENT } from '@angular/common';

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
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.auth.initAuth().subscribe();
  }

  ngAfterViewInit(): void {
    const loadingScreen = this.document.getElementById('app-loading-screen');

    if (loadingScreen) {
      loadingScreen.style.opacity = '0';

      setTimeout(() => {
        loadingScreen.remove();
      }, 1000);
    }
  }
}
