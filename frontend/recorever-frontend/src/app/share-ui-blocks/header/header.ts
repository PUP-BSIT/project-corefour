import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  @Input() public showButtons: boolean = false;
  @Input() public showMenuButton: boolean = false;

  @Output() public menuToggled = new EventEmitter<void>();

  private router = inject(Router);

  public toggleMenu(): void {
    this.menuToggled.emit();
  }

  public onLogoClick(): void {
    const currentUrl: string = this.router.url;

    if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
      this.router.navigate(['/']);
    } else {
      window.scrollTo(0, 0);
      window.location.reload();
    }
  }
}