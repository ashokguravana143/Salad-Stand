import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-5">
        <div class="card card-soft">
          <div class="card-body p-4 p-lg-5">
            <h1 class="h2 fw-bold text-success text-center mb-2">Sign In</h1>
            <p class="text-center text-secondary mb-4">Access your fresh salad orders.</p>
            <div *ngIf="error()" class="alert alert-danger">{{ error() }}</div>
            <form [formGroup]="form" (ngSubmit)="submit()" class="d-grid gap-3">
              <div>
                <label class="form-label">Email Address</label>
                <input class="form-control" type="email" formControlName="email" />
              </div>
              <div>
                <label class="form-label">Password</label>
                <input class="form-control" type="password" formControlName="password" />
              </div>
              <button class="btn btn-success btn-pill" [disabled]="form.invalid || loading()">
                {{ loading() ? 'Signing In...' : 'Sign In' }}
              </button>
            </form>
            <div class="text-center mt-3">
              <a routerLink="/register" class="text-success fw-semibold">Create an Account</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.get('registered')) {
      this.error.set('Registration successful! Please sign in with your new account.');
    }
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/');
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error.error?.detail ?? 'Invalid credentials.');
      }
    });
  }
}
