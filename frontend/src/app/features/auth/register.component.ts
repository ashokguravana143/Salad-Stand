import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-5">
        <div class="card card-soft">
          <div class="card-body p-4 p-lg-5">
            <h1 class="h2 fw-bold text-success text-center mb-2">Create an Account</h1>
            <p class="text-center text-secondary mb-4">Start your journey to fresh salads.</p>
            <div *ngIf="error()" class="alert alert-danger">{{ error() }}</div>
            <form [formGroup]="form" (ngSubmit)="submit()" class="d-grid gap-3">
              <div><label class="form-label">Full Name</label><input class="form-control" formControlName="full_name" /></div>
              <div><label class="form-label">Email Address</label><input class="form-control" type="email" formControlName="email" /></div>
              <div><label class="form-label">Phone Number</label><input class="form-control" formControlName="phone_number" /></div>
              <div><label class="form-label">Password</label><input class="form-control" type="password" formControlName="password" /></div>
              <button class="btn btn-success btn-pill" [disabled]="form.invalid || loading()">{{ loading() ? 'Registering...' : 'Register' }}</button>
            </form>
            <div class="text-center mt-3">
              <a routerLink="/login" class="text-success fw-semibold">Already have an account? Sign In</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    full_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone_number: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/login'], { queryParams: { registered: true } });
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error.error?.detail ?? 'Registration failed.');
      }
    });
  }
}
