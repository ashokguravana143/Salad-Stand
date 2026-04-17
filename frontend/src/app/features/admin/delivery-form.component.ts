import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AppDataService } from '../../core/services/app-data.service';

@Component({
  selector: 'app-delivery-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-5">
        <div class="card card-soft">
          <div class="card-body p-4 p-lg-5">
            <h1 class="h2 fw-bold text-success text-center mb-4">Add New Delivery Boy</h1>
            <form [formGroup]="form" (ngSubmit)="submit()" class="d-grid gap-3">
              <div><label class="form-label">Full Name</label><input class="form-control" formControlName="full_name" /></div>
              <div><label class="form-label">Email Address</label><input class="form-control" type="email" formControlName="email" /></div>
              <div><label class="form-label">Phone Number</label><input class="form-control" formControlName="phone_number" /></div>
              <div><label class="form-label">Password</label><input class="form-control" type="password" formControlName="password" /></div>
              <div class="d-flex justify-content-between">
                <button type="button" class="btn btn-outline-secondary btn-pill" (click)="router.navigateByUrl('/admin/manage-dboy')">Cancel</button>
                <button class="btn btn-success btn-pill">Save Delivery Boy</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DeliveryFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AppDataService);
  readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    full_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone_number: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit() {
    this.api.createDeliveryBoy(this.form.getRawValue()).subscribe(() => this.router.navigateByUrl('/admin/dashboard'));
  }
}
