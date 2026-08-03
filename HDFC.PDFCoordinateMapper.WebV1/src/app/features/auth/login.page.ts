import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <main class="login-page">
      <section class="login-panel">
        <div class="brand-strip">
          <div class="brand-mark">HDFC</div>
          <div>
            <h1>PDF Coordinate Mapper</h1>
            <p>Secure administration login</p>
          </div>
        </div>

        <mat-card appearance="outlined" class="login-card">
          <mat-card-header>
            <mat-card-title>Sign in</mat-card-title>
            <mat-card-subtitle>Use your HDFC administration credentials.</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <mat-form-field appearance="outline">
                <mat-label>User ID / User Name</mat-label>
                <input matInput formControlName="userId" autocomplete="username" />
                @if (form.controls.userId.hasError('required')) {
                  <mat-error>User ID is required.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput type="password" formControlName="password" autocomplete="current-password" />
                @if (form.controls.password.hasError('required')) {
                  <mat-error>Password is required.</mat-error>
                }
              </mat-form-field>

              @if (errorMessage) {
                <p class="form-error">{{ errorMessage }}</p>
              }

              <button mat-flat-button color="primary" class="app-primary-button" type="submit" [disabled]="form.invalid || isSubmitting">
                @if (isSubmitting) {
                  <mat-spinner diameter="18" />
                  <span>Signing in</span>
                } @else {
                  <span>Login</span>
                }
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      </section>
    </main>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 32px;
      background:
        linear-gradient(120deg, rgba(0, 83, 159, 0.94), rgba(0, 74, 143, 0.84)),
        var(--app-background);
    }

    .login-panel {
      width: min(460px, 100%);
    }

    .brand-strip {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 18px;
      color: #ffffff;
    }

    .brand-mark {
      display: grid;
      place-items: center;
      width: 76px;
      height: 48px;
      border: 2px solid #ffffff;
      border-radius: 4px;
      background: var(--hdfc-logo-red);
      font-weight: 800;
      letter-spacing: 0;
    }

    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
    }

    p {
      margin: 4px 0 0;
      color: rgba(255, 255, 255, 0.82);
    }

    .login-card {
      border-radius: 8px;
      border-color: var(--app-border);
      box-shadow: 0 22px 60px rgba(26, 26, 26, 0.22);
    }

    form {
      display: grid;
      gap: 14px;
      margin-top: 18px;
    }

    mat-form-field {
      width: 100%;
    }

    button[type='submit'] {
      min-height: 44px;
      border-radius: 6px;
    }

    button[type='submit'] span {
      margin-left: 8px;
    }

    .form-error {
      margin: 0;
      padding: 10px 12px;
      border-left: 3px solid var(--mat-sys-tertiary);
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      font-size: 13px;
    }
  `]
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private errorTimer: ReturnType<typeof setTimeout> | null = null;

  readonly form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    password: ['', Validators.required]
  });

  isSubmitting = false;
  errorMessage = '';

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.snackBar.open('Login successful.', 'Close', { duration: 4000 });
        this.router.navigateByUrl('/dashboard');
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
        this.scheduleErrorClear(error.message);
        this.snackBar.open(error.message, 'Close', { duration: 4000, panelClass: 'snackbar-error' });
        this.isSubmitting = false;
      }
    });
  }

  private scheduleErrorClear(message: string): void {
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
    }

    this.errorTimer = setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = '';
      }
      this.errorTimer = null;
    }, 4000);
  }
}
