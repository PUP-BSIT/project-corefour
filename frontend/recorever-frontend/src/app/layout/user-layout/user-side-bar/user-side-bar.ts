import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type NavItem = {
  label: string;
  route: string;
  iconPath: string;
};

type AppRoutePathsType = {
  REPORT_LOST: string;
  REPORT_FOUND: string;
  LOST_ITEMS: string;
  FOUND_ITEMS: string;
  PROFILE: string;
  ABOUT_US: string;
};

const AppRoutePaths: AppRoutePathsType = {
  REPORT_LOST: '/app/report-lost',
  REPORT_FOUND: '/app/report-found',
  LOST_ITEMS: '/app/lost-items',
  FOUND_ITEMS: '/app/found-items',
  PROFILE: '/app/profile',
  ABOUT_US: '/about-us',
};

@Component({
  selector: 'app-user-side-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-side-bar.html',
  styleUrl: './user-side-bar.scss',
})
export class UserSideBar {

  protected isProfileDropdownOpen = false;

  protected reportingNav: NavItem[] = [
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

  protected trackingNav: NavItem[] = [
    { label: 'Classic Louie V. bag', route: '/app/tracking/123',
          iconPath: 'assets/tracking-item.png' },
  ];

  protected generalNav: NavItem[] = [
    { label: 'Recents', route: '/app/recents', iconPath: 'assets/recents.png' },
  ];

  protected recentsRoute = AppRoutePaths.LOST_ITEMS;
  protected aboutUsRoute = AppRoutePaths.ABOUT_US;

  public toggleTracking(): void {
    this.isTrackingOpen = !this.isTrackingOpen;
  }

  public toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }
}