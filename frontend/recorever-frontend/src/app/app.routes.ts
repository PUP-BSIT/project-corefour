import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard';

import { HeaderNFooterOnly } from './layout/header-nfooter-only/header-nfooter-only';
import { HeaderOnly } from './layout/header-only/header-only';
import { UserLayout } from './layout/user-layout/user-layout';

import { Homepage } from './page/public/homepage/homepage';
import { AboutUsPage } from './page/public/about-us-page/about-us-page';
import { LoginPage } from './page/public/login-page/login-page';
import { RegisterPage } from './page/public/register-page/register-page';

import { UserItemListPage } from './page/user/user-item-list-page/user-item-list-page';
import { ReportLostPage } from './page/user/report-lost-page/report-lost-page';
import { ReportFoundPage } from './page/user/report-found-page/report-found-page';
import { ProfilePage } from './page/user/profile-page/profile-page';

export const routes: Routes = [
  {
    path: '',
    component: HeaderNFooterOnly,
    children: [
      { path: '', component: Homepage },
      {  path: 'about-us', component: AboutUsPage}
    ],
  },

  {
    path: '',
    component: HeaderOnly,
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
        { path: 'lost-items', component: UserItemListPage, data: { itemType: 'lost' } },
        { path: 'found-items', component: UserItemListPage, data: { itemType: 'found' } },
        { path: 'report-lost', component: ReportLostPage },
        { path: 'report-found', component: ReportFoundPage },
        { path: 'profile', component: ProfilePage },
        { path: 'about-us', component: AboutUsPage }, 
        { path: '', redirectTo: 'lost-items', pathMatch: 'full' },
      ],
  },
];
