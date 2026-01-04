import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { RouterModule, Router, RouteReuseStrategy } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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

export class Header {
  @Input() showButtons: boolean = false;
  @Input() showMenuButton: boolean = false;

  @Output() menuToggled = new EventEmitter<void>();

  isLoggedIn = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private routeReuseStrategy: RouteReuseStrategy,
    private scroller: ViewportScroller
  ) {}

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