import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { RouterModule, Router, RouteReuseStrategy, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { Notification } from '../notification/notification';
import { AuthService } from '../../core/auth/auth-service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    Notification
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  @Input() showButtons: boolean = false;
  @Input() showMenuButton: boolean = false;

  @Output() menuToggled = new EventEmitter<void>();

  public isHomepage$: Observable<boolean>;
  public isLoggedIn = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private routeReuseStrategy: RouteReuseStrategy,
    private scroller: ViewportScroller
  ) {
    this.isHomepage$ = this.router.events.pipe(
      filter((event: RouterEvent):
          event is NavigationEnd => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.urlAfterRedirects === '/'),
      startWith(this.router.url === '/')
    );
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  public toggleMenu(): void {
    this.menuToggled.emit();
  }

  public onLogoClick(): void {
    const currentUrl: string = this.router.url;

    if (currentUrl.includes('login') || currentUrl.includes('register')) {
      this.router.navigate(['/']);
    } else {
      this.scroller.scrollToPosition([0, 0]);

      this.routeReuseStrategy.shouldReuseRoute = () => false;

      this.router.navigate([currentUrl], {
        onSameUrlNavigation: 'reload'
      });
    }
  }
}