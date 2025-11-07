import { Routes } from '@angular/router';

import { HeaderNFooterOnly } from './layout/header-nfooter-only/header-nfooter-only';
import { HeaderOnly } from './layout/header-only/header-only';

import { Homepage } from './page/public/homepage/homepage';
import { AboutUsPage } from './page/public/about-us-page/about-us-page';
import { LoginPage } from './page/public/login-page/login-page';
import { RegisterPage } from './page/public/register-page/register-page';

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
];
