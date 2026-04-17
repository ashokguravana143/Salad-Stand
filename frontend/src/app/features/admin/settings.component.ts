import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { AppDataService } from '../../core/services/app-data.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-7">
        <h1 class="display-6 fw-bold text-success text-center mb-4">Admin Settings</h1>
        <div class="card card-soft">
          <div class="card-body p-4 p-lg-5">
            <h2 class="h4 mb-4">Payment Settings</h2>
            <div *ngIf="message()" class="alert alert-success">{{ message() }}</div>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="cod" formControlName="is_cod_available" />
                <label class="form-check-label" for="cod">Enable Cash on Delivery</label>
              </div>
              <button class="btn btn-success btn-pill">Save Settings</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(AppDataService);
  private readonly fb = inject(FormBuilder);
  readonly message = signal('');

  readonly form = this.fb.nonNullable.group({
    is_cod_available: [true]
  });

  ngOnInit(): void {
    this.api.adminSettings().subscribe((settings) => this.form.patchValue(settings));
  }

  submit() {
    this.api.saveAdminSettings(this.form.getRawValue()).subscribe(() => {
      this.message.set('Settings updated successfully!');
      setTimeout(() => this.message.set(''), 2500);
    });
  }
}
