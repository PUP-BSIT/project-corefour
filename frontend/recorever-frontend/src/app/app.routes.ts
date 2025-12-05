import { Routes } from '@angular/router';

//guards imports
import { authGuard } from './core/auth/auth-guard';
import { publicGuard } from './core/auth/public-guard';
import { adminGuard } from './core/auth/admin-guard';

//layout imports
import { HeaderNFooterOnly } from './layout/header-nfooter-only/header-nfooter-only';
import { HeaderOnly } from './layout/header-only/header-only';
import { UserLayout } from './layout/user-layout/user-layout';
import { AdminLayout } from './layout/admin-layout/admin-layout';

//public pages imports
import { Homepage } from './page/public/homepage/homepage';
import { AboutUsPage } from './page/public/about-us-page/about-us-page';
import { LoginPage } from './page/public/login-page/login-page';
import { RegisterPage } from './page/public/register-page/register-page';

//user pages imports
import { UserItemListPage } from './page/user/user-item-list-page/user-item-list-page';
import { ReportLostPage } from './page/user/report-lost-page/report-lost-page';
import { ReportFoundPage } from './page/user/report-found-page/report-found-page';
import { ProfilePage } from './page/user/profile-page/profile-page';

//admin pages imports
import { AdminDashboardPage } from './page/admin/admin-dashboard-page/admin-dashboard-page';
import { ManageItemsPage } from './page/admin/manage-items-page/manage-items-page';
import { AdminItemListPage } from './page/admin/admin-item-list-page/admin-item-list-page';
import { ClaimStatusManagement } from './page/admin/claim-status-management/claim-status-management';

export const AppRoutePaths = {
  REPORT_LOST: '/app/report-lost',
  REPORT_FOUND: '/app/report-found',
  LOST_ITEMS: '/app/lost-items',
  FOUND_ITEMS: '/app/found-items',
  PROFILE: '/app/profile',
  ABOUT_US: '/app/about-us',
};

export const routes: Routes = [
  {
    path: '',
    component: HeaderNFooterOnly,
    canActivate: [publicGuard],
    children: [
      { path: '', component: Homepage },
      {  path: 'about-us', component: AboutUsPage}
    ],
  },

  {
    path: '',
    component: HeaderOnly,
    canActivate: [publicGuard],
    children: [
      { path: 'login', component: LoginPage },
      { path: 'register', component: RegisterPage },
    ],
  },

  {
    path: 'app',
      component: UserLayout,
      canActivate: [authGuard],
      children: [
        { path: 'lost-items', component: UserItemListPage,
            data: { itemType: 'lost' } },
        { path: 'found-items', component: UserItemListPage,
            data: { itemType: 'found' } },
        { path: 'report-lost', component: ReportLostPage },
        { path: 'report-found', component: ReportFoundPage },
        { path: 'profile', component: ProfilePage },
        { path: 'about-us', component: AboutUsPage },
        { path: '', redirectTo: 'lost-items', pathMatch: 'full' },
      ],
  },

  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardPage },
      { path: 'manage-items', component: ManageItemsPage },
      { path: 'lost-items', component: AdminItemListPage, data: { itemType: 'lost' } },
      { path: 'found-items', component: AdminItemListPage, data: { itemType: 'found' } },
      { path: 'claim-status', component: ClaimStatusManagement },
    ],
  },
];
