import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { MenuNode, ModuleAccessItem } from '../../core/auth/auth.models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <section class="dashboard">
      <header class="page-header">
        <div>
          <h1>Select Module</h1>
          <p>{{ authStore.user()?.userName || authStore.user()?.userId }} can access the modules below.</p>
        </div>
      </header>

      @if (authStore.selectedModuleId() && authStore.menu().length) {
        <mat-card appearance="outlined" class="selected-module-card">
          <mat-card-header>
            <mat-card-title>{{ selectedModuleLabel() }}</mat-card-title>
            <mat-card-subtitle>Module menu loaded from API.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>{{ authStore.menu().length }} top-level menu item(s) are available in the sidebar.</p>
          </mat-card-content>
        </mat-card>
      } @else if (authStore.modules().length) {
        <div class="module-grid">
          @for (module of authStore.modules(); track module.moduleId || module.moduleName) {
            <mat-card appearance="outlined" class="module-card" [class.selected]="authStore.selectedModuleId() === module.moduleId">
              <mat-card-header>
                <mat-card-title>{{ module.moduleName || module.moduleId }}</mat-card-title>
                <mat-card-subtitle>{{ module.moduleId }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @if (module.link) {
                  <p>{{ module.link }}</p>
                }
              </mat-card-content>
              <mat-card-actions align="end">
                <button
                  mat-flat-button
                  color="primary"
                  class="app-primary-button"
                  type="button"
                  [disabled]="loadingModuleId === module.moduleId"
                  (click)="selectModule(module)">
                  @if (loadingModuleId === module.moduleId) {
                    <mat-spinner diameter="16" />
                    <span>Loading</span>
                  } @else if (authStore.selectedModuleId() === module.moduleId) {
                    <span>Selected</span>
                  } @else {
                    <span>Select</span>
                  }
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      } @else {
        <mat-card appearance="outlined" class="empty-card">
          <mat-card-content>No module access records were returned by the API.</mat-card-content>
        </mat-card>
      }
    </section>
  `,
  styles: [`
    .dashboard {
      display: grid;
      gap: 18px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 58px;
    }

    h1 {
      margin: 0;
      color: var(--app-heading);
      font-size: 22px;
      font-weight: 700;
    }

    p {
      margin: 4px 0 0;
      color: var(--app-muted);
    }

    .module-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    mat-card {
      border-radius: 8px;
      border-color: var(--app-border);
      background: var(--app-surface);
    }

    .module-card {
      display: grid;
      min-height: 178px;
    }

    .module-card.selected {
      border-color: var(--app-primary);
      background: var(--app-primary-soft);
    }

    mat-card-content {
      min-height: 36px;
    }

    mat-card-actions {
      align-self: end;
      padding: 0 16px 16px;
    }

    button {
      min-width: 104px;
      border-radius: 6px;
    }

    button span {
      margin-left: 6px;
    }

    .selected-module-card,
    .empty-card {
      width: min(520px, 100%);
    }

    mat-card-subtitle,
    .empty-card {
      color: var(--app-muted);
    }

    @media (max-width: 900px) {
      .module-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardPage {
  readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loadingModuleId = '';

  selectModule(module: ModuleAccessItem): void {
    if (!module.moduleId || this.loadingModuleId) {
      return;
    }

    this.loadingModuleId = module.moduleId;
    this.authService.selectModule(module).subscribe({
      next: (menu) => {
        this.loadingModuleId = '';
        const route = firstKnownRoute(menu);
        if (route) {
          this.router.navigateByUrl(route);
        }
      },
      error: () => {
        this.loadingModuleId = '';
      }
    });
  }

  selectedModuleLabel(): string {
    const selectedModuleId = this.authStore.selectedModuleId();
    const selectedModule = this.authStore.modules().find((module) => module.moduleId === selectedModuleId);
    return selectedModule?.moduleName || selectedModule?.moduleId || 'Selected Module';
  }
}

function firstKnownRoute(menu: MenuNode[]): string {
  const knownRoutes = new Set(['/dashboard', '/administration/users', '/administration/roles', '/administration/role-menu-access', '/administration/common-approval']);
  const stack = [...menu];

  while (stack.length) {
    const node = stack.shift();
    if (!node) {
      continue;
    }

    if (node.route && knownRoutes.has(node.route)) {
      return node.route;
    }

    stack.unshift(...node.children);
  }

  return '';
}
