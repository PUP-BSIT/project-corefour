import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard';
import { publicGuard } from './core/auth/public-guard';
import { adminGuard } from './core/auth/admin-guard';

import { HeaderNFooterOnly
  } from './layout/header-nfooter-only/header-nfooter-only';
import { HeaderOnly } from './layout/header-only/header-only';
import { UserLayout } from './layout/user-layout/user-layout';
import { AdminLayout } from './layout/admin-layout/admin-layout';

export const AppRoutePaths = {
  REPORT_LOST: '/app/report-lost',
  REPORT_FOUND: '/app/report-found',
  LOST_ITEMS: '/app/lost-items',
  FOUND_ITEMS: '/app/found-items',
  PROFILE: '/app/profile',
  USER_PROFILE: (id: number | string) => `/app/profile/${id}`,
  ABOUT_US: '/app/about-us',
  REPORT_STATUS_MANAGEMENT: '/admin/report-status',
  HELP_PAGE: '/help-page',
};

export const routes: Routes = [
  {
    path: '',
    component: HeaderNFooterOnly,
    canActivate: [publicGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./page/public/homepage/homepage')
          .then(m => m.Homepage)
      },
      {
        path: 'about-us',
        loadComponent: () => import('./page/public/about-us-page/about-us-page')
          .then(m => m.AboutUsPage)
      },
      {
        path: 'help-page',
        loadComponent: () => import('./page/public/help-page/help-page')
          .then(m => m.HelpPage)
      }
    ],
  },
  {
    path: '',
    component: HeaderOnly,
    canActivate: [publicGuard],
    children: [
      { path: 'login',
        loadComponent: () => import('./page/public/login-page/login-page')
          .then(m => m.LoginPage) },
      { path: 'register',
        loadComponent: () => import('./page/public/register-page/register-page')
          .then(m => m.RegisterPage) },
      { path: 'forgot-password',
        loadComponent: () =>
          import('./page/public/forgot-pass-page/forgot-pass-page')
            .then(m => m.ForgotPassPage) },
      { path: 'reset-password',
        loadComponent: () =>
          import('./page/public/reset-pass-page/reset-pass-page')
            .then(m => m.ResetPassPage) },
    ],
  },
  {
    path: 'app',
    component: UserLayout,
    children: [
      { path: 'lost-items',
        loadComponent: () =>
          import('./page/user/user-item-list-page/user-item-list-page')
            .then(m => m.UserItemListPage),
        data: { itemType: 'lost' }
      },
      { path: 'found-items',
        loadComponent: () =>
          import('./page/user/user-item-list-page/user-item-list-page')
            .then(m => m.UserItemListPage),
        data: { itemType: 'found' }
      },
      { path: 'report-lost',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./page/user/report-lost-page/report-lost-page')
            .then(m => m.ReportLostPage)
      },
      { path: 'report-found',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./page/user/report-found-page/report-found-page')
            .then(m => m.ReportFoundPage)
      },
      { path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./page/user/profile-page/profile-page')
          .then(m => m.ProfilePage)
      },
      { path: 'profile/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./page/user/profile-page/profile-page')
          .then(m => m.ProfilePage)
      },
      { path: 'notifications',
        canActivate: [authGuard],
        loadComponent: () => import(
          './page/shared-page/notification-page/notification-page'
        ).then(m => m.NotificationPage)
      },
      { path: 'about-us',
        loadComponent: () => import('./page/public/about-us-page/about-us-page')
          .then(m => m.AboutUsPage)
      },
      {
        path: 'help-page',
        loadComponent: () => import('./page/public/help-page/help-page')
          .then(m => m.HelpPage)
      },
      { path: '', redirectTo: 'lost-items', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: 'dashboard',
        loadComponent: () =>
          import('./page/admin/admin-dashboard-page/admin-dashboard-page')
            .then(m => m.AdminDashboardPage)
      },
      { path: 'manage-items',
        loadComponent: () =>
          import('./page/admin/manage-items-page/manage-items-page')
            .then(m => m.ManageItemsPage)
      },
      { path: 'lost-items',
        loadComponent: () =>
          import('./page/admin/admin-item-list-page/admin-item-list-page')
            .then(m => m.AdminItemListPage),
        data: { itemType: 'lost', status: 'approved' }
      },
      { path: 'found-items',
        loadComponent: () =>
          import('./page/admin/admin-item-list-page/admin-item-list-page')
            .then(m => m.AdminItemListPage),
        data: { itemType: 'found', status: 'approved' }
      },
      { path: 'report-status',
        loadComponent: () =>
          import('./page/admin/lost-status-page/lost-status-page')
            .then(m => m.LostStatusPage)
      },
      { path: 'archive/resolved',
        loadComponent: () =>
          import('./page/admin/admin-item-list-page/admin-item-list-page')
            .then(m => m.AdminItemListPage),
        data: { type: 'lost', status: 'matched' }
      },
      { path: 'archive/claimed',
        loadComponent: () =>
          import('./page/admin/admin-item-list-page/admin-item-list-page')
            .then(m => m.AdminItemListPage),
        data: { type: 'found', status: 'claimed' }
      },
      { path: 'claim-status',
        loadComponent: () =>
          import('./page/admin/found-status-page/claim-status-page')
            .then(m => m.ClaimStatusPage)
      },
      { path: 'notifications',
        loadComponent: () => import(
          './page/shared-page/notification-page/notification-page'
        ).then(m => m.NotificationPage)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];