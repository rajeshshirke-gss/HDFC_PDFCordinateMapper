import { Routes } from '@angular/router';

import { MasterImportPage } from './master-import.page';

export const masterImportRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'AMC' },
  { path: ':masterKey', component: MasterImportPage }
];
