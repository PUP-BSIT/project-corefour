import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { NavItem, ProfileNavItem, User } from '../../../models/user-model';
import { AppRoutePaths } from '../../../app.routes';
import { Notification } from '../../../share-ui-blocks/notification/notification';
import { AuthService } from '../../../core/auth/auth-service';

@Component({
  selector: 'app-user-side-bar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    Notification,
    AsyncPipe
  ], 
  templateUrl: './user-side-bar.html',
  styleUrl: './user-side-bar.scss',
})
export class UserSideBar {
  private authService = inject(AuthService);

  @Output() openSettingsModal = new EventEmitter<void>();
  @Output() openLogoutModal = new EventEmitter<void>();

  public currentUser$: Observable<User | null> = this.authService.currentUser$;

  protected isProfileDropdownOpen = false;

  protected profileDropdownItems: ProfileNavItem[] = [
    { label: 'Profile', iconPath: 'assets/profile-avatar.png',
        action: 'navigate', route: AppRoutePaths.PROFILE },
    { label: 'Settings', iconPath: 'assets/setting.png',
        action: 'emit' },
    { label: 'About us', iconPath: 'assets/about-us.png',
        action: 'navigate', route: AppRoutePaths.ABOUT_US },
    { label: 'Add Account', iconPath: 'assets/add-icon.png',
        action: 'addAccount' },
    { label: 'Log out', iconPath: 'assets/log-out.png', action: 'logout' },
  ];

  protected mainNav: NavItem[] = [
    { label: 'Lost Items', route: AppRoutePaths.LOST_ITEMS,
        iconPath: 'assets/lost-items.png' },
    { label: 'Report Lost Item', route: AppRoutePaths.REPORT_LOST,
        iconPath: 'assets/reported-lost-items.png' },
    { label: 'Found Items', route: AppRoutePaths.FOUND_ITEMS,
        iconPath: 'assets/found-items.png' },
    { label: 'Report Found Item', route: AppRoutePaths.REPORT_FOUND,
        iconPath: 'assets/reported-found-item.png' },
  ];

  protected isTrackingOpen = true;
  protected profileRoute = AppRoutePaths.PROFILE;
  protected aboutUsRoute = AppRoutePaths.ABOUT_US;

  protected trackingNav: NavItem[] = [
    { label: 'Classic Louie V. bag', route: '/app/tracking/123',
          iconPath: 'assets/tracking-item.png' },
  ];

  constructor(private router: Router) {}

  public toggleTracking(): void {
    this.isTrackingOpen = !this.isTrackingOpen;
  }

  public toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  public handleDropdownAction(item: ProfileNavItem): void {
    this.isProfileDropdownOpen = false;

    switch (item.action) {
      case 'navigate':
        if (item.route) {
          this.router.navigate([item.route]);
        }
        break;
      case 'emit':
        this.openSettingsModal.emit();
        break;
      case 'addAccount':
        this.router.navigate(['/login']);
        break;
      case 'logout':
        this.openLogoutModal.emit();
        break;
    }
  }
}