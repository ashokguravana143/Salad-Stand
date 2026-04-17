import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { AppDataService } from '../../core/services/app-data.service';
import { MenuItem } from '../../core/models/app.models';

@Component({
  selector: 'app-salad-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-7">
        <div class="card card-soft">
          <div class="card-body p-4 p-lg-5">
            <h1 class="h2 fw-bold text-success text-center mb-4">{{ menuId ? 'Edit Salad' : 'Add New Salad' }}</h1>
            <form [formGroup]="form" (ngSubmit)="submit()" class="d-grid gap-3">
              <div><label class="form-label">Name</label><input class="form-control" formControlName="name" /></div>
              <div><label class="form-label">Description</label><textarea class="form-control" rows="4" formControlName="description"></textarea></div>
              <div><label class="form-label">Price</label><input class="form-control" type="number" step="0.01" formControlName="price" /></div>
              <div>
                <label class="form-label">Upload Image</label>
                <input class="form-control" type="file" accept="image/*" (change)="onFileSelected($event)" />
                <small class="text-muted">Supported formats: JPEG, PNG, GIF, WebP.</small>
              </div>
              <div *ngIf="currentImage" class="mb-3">
                <div class="text-muted mb-2">Preview</div>
                <img [src]="currentImage" alt="Salad preview" class="img-fluid rounded" style="max-height: 220px; object-fit: cover;" />
              </div>
              <div class="form-check"><input class="form-check-input" type="checkbox" formControlName="available" id="available" /><label class="form-check-label" for="available">Mark as Available for Customers</label></div>
              <div class="d-flex justify-content-between">
                <button type="button" class="btn btn-outline-secondary btn-pill" (click)="router.navigateByUrl('/admin/menu')">Cancel</button>
                <button class="btn btn-success btn-pill" [disabled]="loading">{{ loading ? 'Saving...' : (menuId ? 'Save Salad' : 'Create Salad') }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SaladFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AppDataService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  menuId = Number(this.route.snapshot.paramMap.get('id') ?? 0) || null;
  selectedFile: File | null = null;
  currentImage: string | null = null;
  loading = false;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    price: [0, [Validators.required]],
    available: [true]
  });

  ngOnInit(): void {
    const state = history.state?.salad as MenuItem | undefined;
    if (state) {
      this.form.patchValue({
        ...state,
        description: state.description ?? ''
      });
      this.currentImage = state.image_url ? `${environment.apiBaseUrl}${state.image_url}` : null;
      return;
    }
    if (this.menuId) {
      this.api.adminMenu().subscribe((rows) => {
        const salad = rows.find((row) => row.id === this.menuId);
        if (salad) {
          this.form.patchValue({
            ...salad,
            description: salad.description ?? ''
          });
          this.currentImage = salad.image_url ? `${environment.apiBaseUrl}${salad.image_url}` : null;
        }
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    this.selectedFile = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentImage = e.target?.result as string;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  submit() {
    if (this.form.invalid) {
      return;
    }

    const formData = new FormData();
    const values = this.form.getRawValue();

    formData.append('name', values.name);
    formData.append('description', values.description || '');
    formData.append('price', values.price.toString());
    formData.append('available', values.available.toString());

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.loading = true;
    const request = this.menuId
      ? this.api.updateMenu(this.menuId, formData)
      : this.api.createMenu(formData);

    request.subscribe({
      next: () => this.router.navigateByUrl('/admin/menu'),
      error: () => (this.loading = false),
    });
  }
}
