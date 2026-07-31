import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../auth/auth.store';
import { MenuNode } from '../auth/auth.models';

@Component({
  selector: 'app-application-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatToolbarModule, MatSnackBarModule],
  template: `
    <section class="app-shell" [class.sidebar-collapsed]="isSidebarCollapsed" [class.has-sidebar]="hasSidebarMenu()">
      <mat-toolbar class="topbar">
        @if (hasSidebarMenu()) {
          <button mat-icon-button type="button" (click)="toggleSidebar()" [attr.aria-label]="isSidebarCollapsed ? 'Expand menu' : 'Collapse menu'">
            <mat-icon>menu</mat-icon>
          </button>
        }
        <div class="brand">
          <span class="brand-mark">HDFC</span>
          <span>PDF Coordinate Mapper</span>
        </div>
        <span class="spacer"></span>
        <span class="user-name">{{ authStore.user()?.userName || authStore.user()?.userId }}</span>
        <button mat-stroked-button type="button" (click)="logout()">Logout</button>
      </mat-toolbar>

      <div class="shell-body">
        @if (hasSidebarMenu()) {
          <aside class="sidebar">
            <nav class="menu-tree" aria-label="Application menu">
              @for (node of authStore.menu(); track node.id || node.label) {
                <ng-container *ngTemplateOutlet="menuNodeTemplate; context: { $implicit: node, level: 0 }"></ng-container>
              }
            </nav>
          </aside>
        }

        <main class="content">
          <router-outlet />
        </main>
      </div>

      <ng-template #menuNodeTemplate let-node let-level="level">
        <div class="menu-node" [style.--level]="level">
          @if (node.children.length) {
            <button class="menu-item parent" type="button" (click)="onParentMenuClick(node)" [class.active]="isExpanded(node)">
              <ng-container *ngTemplateOutlet="menuIconTemplate; context: { $implicit: node }"></ng-container>
              <span class="menu-label">{{ node.label }}</span>
              <span class="spacer"></span>
              <mat-icon class="expand-icon">{{ isExpanded(node) ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
            @if (isExpanded(node) && !isSidebarCollapsed) {
              <div class="children">
                @for (child of node.children; track child.id || child.label) {
                  <ng-container *ngTemplateOutlet="menuNodeTemplate; context: { $implicit: child, level: level + 1 }"></ng-container>
                }
              </div>
            }
          } @else if (node.route) {
            <a class="menu-item" [routerLink]="node.route" routerLinkActive="active">
              <ng-container *ngTemplateOutlet="menuIconTemplate; context: { $implicit: node }"></ng-container>
              <span class="menu-label">{{ node.label }}</span>
            </a>
          } @else {
            <span class="menu-item disabled">
              <ng-container *ngTemplateOutlet="menuIconTemplate; context: { $implicit: node }"></ng-container>
              <span class="menu-label">{{ node.label }}</span>
            </span>
          }
        </div>
      </ng-template>

      <ng-template #menuIconTemplate let-node>
        @if (node.iconType === 'fontawesome') {
          <i class="menu-fa-icon" [ngClass]="node.icon" aria-hidden="true"></i>
        } @else {
          <mat-icon>{{ node.icon }}</mat-icon>
        }
      </ng-template>
    </section>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      background: var(--app-background);
    }

    .topbar {
      height: 56px;
      background: var(--hdfc-header-bg);
      color: var(--hdfc-header-text);
      border-bottom: 1px solid var(--app-border);
      box-shadow: 0 1px 2px var(--mat-sys-shadow);
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-left: 8px;
      font-size: 16px;
      font-weight: 700;
      color: var(--hdfc-header-text);
    }

    .brand-mark {
      display: inline-grid;
      place-items: center;
      width: 56px;
      height: 32px;
      border: 1px solid var(--hdfc-logo-red);
      border-radius: 4px;
      background: var(--hdfc-logo-red);
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
    }

    .spacer {
      flex: 1;
    }

    .user-name {
      margin-right: 14px;
      font-size: 13px;
      color: var(--hdfc-header-text);
    }

    .topbar button {
      color: var(--hdfc-header-text);
      border-color: var(--hdfc-header-outline);
    }

    .topbar button:hover {
      background: var(--hdfc-header-bg-hover);
    }

    .shell-body {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      min-height: calc(100vh - 56px);
      transition: grid-template-columns 160ms ease;
    }

    .has-sidebar .shell-body {
      grid-template-columns: 248px minmax(0, 1fr);
    }

    .has-sidebar.sidebar-collapsed .shell-body {
      grid-template-columns: 72px minmax(0, 1fr);
    }

    .sidebar {
      position: relative;
      padding: 16px 12px;
      border-right: 1px solid var(--app-border);
      background: var(--app-surface);
      overflow: hidden;
    }

    .menu-tree {
      display: grid;
      gap: 4px;
    }

    .menu-node {
      min-width: 0;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      min-height: 38px;
      padding: 8px 10px 8px calc(10px + (var(--level) * 14px));
      border: 0;
      border-left: 3px solid transparent;
      border-radius: 4px;
      background: transparent;
      color: var(--app-ink);
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
      font-weight: 600;
      text-align: left;
      text-decoration: none;
    }

    .menu-item:hover,
    .menu-item.active {
      border-left-color: var(--app-primary);
      background: var(--app-primary-soft);
      color: var(--app-primary-dark);
    }

    .menu-item.disabled {
      cursor: default;
      opacity: 0.62;
    }

    .menu-item mat-icon,
    .menu-fa-icon {
      width: 20px;
      min-width: 20px;
      height: 20px;
      font-size: 20px;
    }

    .menu-fa-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 20px;
    }

    .expand-icon {
      margin-left: auto;
    }

    .sidebar-collapsed .menu-item {
      justify-content: center;
      padding: 8px;
    }

    .sidebar-collapsed .menu-label,
    .sidebar-collapsed .expand-icon {
      display: none;
    }

    .empty-menu {
      display: block;
      padding: 8px 10px;
      border: 1px solid var(--app-border);
      border-radius: 4px;
      color: var(--app-muted);
      font-size: 13px;
    }

    .content {
      min-width: 0;
      padding: 16px 22px;
      background: var(--app-background);
    }

    @media (max-width: 760px) {
      .shell-body {
        grid-template-columns: 1fr;
      }

      .sidebar {
        border-right: 0;
        border-bottom: 1px solid var(--app-border);
      }
    }
  `]
})
export class ApplicationShellComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly expandedNodeIds = new Set<string>();
  isSidebarCollapsed = false;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    if (!this.authStore.modules().length) {
      this.authService.loadAuthorizedModules().subscribe();
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleNode(node: MenuNode): void {
    if (this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
    }

    const key = node.id || node.label;
    if (this.expandedNodeIds.has(key)) {
      this.expandedNodeIds.delete(key);
    } else {
      this.expandedNodeIds.add(key);
    }
  }

  onParentMenuClick(node: MenuNode): void {
    if (node.route) {
      this.router.navigateByUrl(node.route);
    }

    this.toggleNode(node);
  }

  isExpanded(node: MenuNode): boolean {
    return this.expandedNodeIds.has(node.id || node.label);
  }

  hasSidebarMenu(): boolean {
    return Boolean(this.authStore.selectedModuleId() && this.authStore.menu().length);
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.snackBar.open('Logged out.', 'Close', { duration: 5000 });
      this.router.navigateByUrl('/login');
    });
  }
}
