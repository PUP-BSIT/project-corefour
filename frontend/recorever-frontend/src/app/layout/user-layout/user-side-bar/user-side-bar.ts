import { Component, inject, OnDestroy, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, switchMap, takeUntil, catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavItem, ProfileNavItem, User } from '../../../models/user-model';
import { AppRoutePaths } from '../../../app.routes';
import { Notification } from '../../../share-ui-blocks/notification/notification';
import { AuthService } from '../../../core/auth/auth-service';
import { ConfirmationModal } from '../../../modal/confirmation-modal/confirmation-modal';
import { SettingsModal } from '../../../modal/settings-modal/settings-modal';
import { LogoutResponse } from '../../../models/auth-model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-user-side-bar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    Notification,
    ConfirmationModal,
    MatDialogModule
  ], 
  templateUrl: './user-side-bar.html',
  styleUrl: './user-side-bar.scss',
})
export class UserSideBar implements OnDestroy {
  private authService = inject(AuthService);
  public router = inject(Router);
  private dialog = inject(MatDialog);

  @ViewChild('profileSection') profileSection!: ElementRef;

  public currentUser = toSignal(
    this.authService.currentUser$.pipe(
      catchError(() => of(null))
    ), 
    { initialValue: null }
  );

  public currentUser$ = this.authService.currentUser$;
  private currentUserSignal = toSignal(this.currentUser$);

  protected isLogoutModalOpen = false;
  protected isProfileDropdownOpen = false;
  
  protected showLoginModal = false;
  
  private protectedRoutes = [
    AppRoutePaths.REPORT_LOST,
    AppRoutePaths.REPORT_FOUND
  ];

  private logoutTrigger$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  protected getProfileImageUrl(path: string | null | undefined): string {
      if (!path) {
        return 'assets/profile-avatar.png';
      }
      if (path.startsWith('http')) {
        return path.replace('http://', 'https://');
      }

    const secureBaseUrl = environment.apiUrl.replace('http://', 'https://');
    return `${secureBaseUrl}/image/download/${path}`;
  }

  protected profileDropdownItems: ProfileNavItem[] = [
    { label: 'Profile', iconPath: 'assets/profile-avatar.png',
        action: 'navigate', route: AppRoutePaths.PROFILE },
    { label: 'Settings', iconPath: 'assets/setting.png',
        action: 'openSettings' },
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

  constructor() {
    this.logoutTrigger$
      .pipe(
        switchMap(() => this.authService.logout()),
        takeUntil(this.destroy$) 
      )
      .subscribe({
        next: (_response: LogoutResponse) => {
          this.isLogoutModalOpen = false;
        },
        error: (_err: Error) => {
          this.isLogoutModalOpen = false;
        }
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      this.isProfileDropdownOpen && 
      this.profileSection && 
      !this.profileSection.nativeElement.contains(event.target as Node)
    ) {
      this.isProfileDropdownOpen = false;
    }
  }

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
      case 'openSettings':
        this.dialog.open(SettingsModal, {
        });
        break;
      case 'addAccount':
        this.router.navigate(['/login']);
        break;
      case 'logout':
        this.isLogoutModalOpen = true;
        break;
    }
  }

  public isProtected(route: string): boolean {
    return this.protectedRoutes.includes(route);
  }

  public isRouteActive(route: string): boolean {
    return this.router.isActive(route, { 
      paths: 'exact', 
      queryParams: 'ignored', 
      fragment: 'ignored', 
      matrixParams: 'ignored' 
    });
  }

  public onProtectedLinkClick(route: string): void {
    if (this.currentUserSignal()) {
      // User is logged in, navigate
      this.router.navigate([route]);
    } else {
      // User is NOT logged in, show modal
      this.showLoginModal = true;
    }
  }

  public onLoginModalConfirm(): void {
    this.showLoginModal = false;
    this.router.navigate(['/login']);
  }

  public onLoginModalCancel(): void {
    this.showLoginModal = false;
  }

  protected onLogoutConfirm(): void {
    this.logoutTrigger$.next();
  }

  protected onLogoutCancel(): void {
    this.isLogoutModalOpen = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}