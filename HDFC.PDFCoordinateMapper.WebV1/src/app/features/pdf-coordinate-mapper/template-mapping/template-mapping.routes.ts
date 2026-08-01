import { Routes } from '@angular/router';

import { TemplateMappingPage } from './template-mapping.page';
import { TemplateMappingWorkspacePage } from './template-mapping-workspace.page';

export const templateMappingRoutes: Routes = [
  { path: '', component: TemplateMappingPage },
  { path: 'create', component: TemplateMappingWorkspacePage },
  { path: ':id/view', component: TemplateMappingWorkspacePage },
  { path: ':id/edit', component: TemplateMappingWorkspacePage }
];
