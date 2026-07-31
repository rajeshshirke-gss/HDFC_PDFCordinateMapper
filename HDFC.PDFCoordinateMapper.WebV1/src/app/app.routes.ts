import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { ApplicationShellComponent } from './core/layout/application-shell.component';
import { LoginPage } from './features/auth/login.page';
import { DashboardPage } from './features/dashboard/dashboard.page';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  {
    path: '',
    component: ApplicationShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardPage },
      {
        path: 'administration/users',
        loadChildren: () =>
          import('./features/administration/users/user-master.routes').then((m) => m.userMasterRoutes)
      },
      {
        path: 'administration/roles',
        loadChildren: () =>
          import('./features/administration/roles/role-master.routes').then((m) => m.roleMasterRoutes)
      },
      {
        path: 'administration/role-menu-access',
        loadChildren: () =>
          import('./features/administration/role-menu-access/role-menu-access.routes').then((m) => m.roleMenuAccessRoutes)
      },
      {
        path: 'administration/common-approval',
        loadChildren: () =>
          import('./features/administration/common-approval/common-approval.routes').then((m) => m.commonApprovalRoutes)
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
