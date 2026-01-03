import { Component, Output, EventEmitter, inject, OnDestroy, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, switchMap, takeUntil, catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavItem, ProfileNavItem, User } from '../../../models/user-model';
import { Notification } from '../../../share-ui-blocks/notification/notification';
import { AuthService } from '../../../core/auth/auth-service';
import { ConfirmationModal } from '../../../modal/confirmation-modal/confirmation-modal';
import { LogoutResponse } from '../../../models/auth-model';
import { AppRoutePaths } from '../../../app.routes';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-side-bar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    Notification,
    ConfirmationModal
  ], 
  templateUrl: './admin-side-bar.html',
  styleUrls: ['./admin-side-bar.scss'],
})
export class AdminSideBar implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  @Output() openSettingsModal = new EventEmitter<void>();

  @ViewChild('profileSection') profileSection!: ElementRef;

  // REFACTORED: Converted to Signal to allow usage without @if wrapper in HTML
  public currentUser = toSignal(
    this.authService.currentUser$.pipe(
      catchError(() => of(null))
    ), 
    { initialValue: null }
  );

  protected isLogoutModalOpen = false;
  protected isProfileDropdownOpen = false;
  protected isArchiveOpen = true;
  
  private logoutTrigger$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  protected getProfileImageUrl(path: string | null | undefined): string {
    if (!path) {
      return 'assets/profile-avatar.png';
    }
    if (path.startsWith('http')) {
      return path;
    }

    return `${environment.apiUrl}/image/download/${path}`;
  }

  protected profileDropdownItems: ProfileNavItem[] = [
    { label: 'Settings', iconPath: 'assets/setting.png',
        action: 'emit' },
    { label: 'Log out', iconPath: 'assets/log-out.png', action: 'logout' },
  ];

  protected adminSideBarLinks: NavItem[] = [
    {
      label: "Dashboard",
      iconPath: "/assets/recents.png",
      route: "/admin/dashboard",
    },
    {
      label: "Manage Lost Item",
      iconPath: "/assets/report-status.png",
      route: AppRoutePaths.REPORT_STATUS_MANAGEMENT,
    },
    {
      label: "Found Status Management",
      iconPath: "/assets/claim-status.png",
      route: "/admin/claim-status",
    },
  ];

  protected archiveSection: NavItem = {
      label: "Archive Items",
      iconPath: "/assets/archive-folder.png",
      route: "/admin/archive", 
  }

  protected archiveNav: NavItem[] = [
    {
      label: "Resolved Items",
      iconPath: "/assets/resolved-item.png",
      route: "/admin/archive/resolved",
    },
    {
      label: "Claimed Items",
      iconPath: "/assets/claimed-item.png",
      route: "/admin/archive/claimed",
    },
  ];

  protected mainNav = this.adminSideBarLinks;

  constructor() {
    this.logoutTrigger$
      .pipe(
        switchMap(() => this.authService.logout()),
        takeUntil(this.destroy$) 
      )
      .subscribe({
        next: (_response: LogoutResponse) => {
          this.isLogoutModalOpen = false;
          this.router.navigate(['/login']); 
        },
        error: (_err) => {
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

  public toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  public toggleArchive(): void {
    this.isArchiveOpen = !this.isArchiveOpen;
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
      case 'logout':
        this.isLogoutModalOpen = true;
        break;
    }
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