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
          import('./features/administration/users/user-master.routes').then(
            (m) => m.userMasterRoutes,
          ),
      },
      {
        path: 'administration/roles',
        loadChildren: () =>
          import('./features/administration/roles/role-master.routes').then(
            (m) => m.roleMasterRoutes,
          ),
      },
      {
        path: 'administration/role-menu-access',
        loadChildren: () =>
          import('./features/administration/role-menu-access/role-menu-access.routes').then(
            (m) => m.roleMenuAccessRoutes,
          ),
      },
      {
        path: 'administration/common-approval',
        loadChildren: () =>
          import('./features/administration/common-approval/common-approval.routes').then(
            (m) => m.commonApprovalRoutes,
          ),
      },
      {
        path: 'pdf-coordinate-mapper/template-master',
        loadChildren: () =>
          import('./features/pdf-coordinate-mapper/template-master/template-master.routes').then(
            (m) => m.templateMasterRoutes,
          ),
      },
      {
        path: 'pdf-coordinate-mapper/template-mapping',
        loadChildren: () =>
          import('./features/pdf-coordinate-mapper/template-mapping/template-mapping.routes').then(
            (m) => m.templateMappingRoutes,
          ),
      },
      {
        path: 'pdf-coordinate-mapper/amc-master',
        loadChildren: () =>
          import('./features/pdf-coordinate-mapper/amc-master/amc-master.routes').then(
            (m) => m.amcMasterRoutes,
          ),
      },
      {
        path: 'pdf-coordinate-mapper/common-approval',
        loadChildren: () =>
          import('./features/pdf-coordinate-mapper/common-approval/mf-common-approval.routes').then(
            (m) => m.mfCommonApprovalRoutes,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
