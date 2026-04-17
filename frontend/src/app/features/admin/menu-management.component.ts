import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AppDataService } from '../../core/services/app-data.service';
import { MenuItem } from '../../core/models/app.models';

@Component({
  selector: 'app-admin-menu-management',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="display-6 fw-bold text-success mb-0">Manage Menu</h1>
      <a routerLink="/admin/menu/add" class="btn btn-success btn-pill">Add New Salad</a>
    </div>
    <div class="card card-soft">
      <div class="card-body p-4">
        <div class="table-responsive" *ngIf="salads().length; else empty">
          <table class="table align-middle">
            <thead><tr><th>Name</th><th>Price</th><th>Availability</th><th class="text-end">Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let salad of salads()">
                <td>{{ salad.name }}</td>
                <td>{{ salad.price | currency:'INR':'symbol':'1.2-2' }}</td>
                <td><span class="badge" [class.text-bg-success]="salad.available" [class.text-bg-danger]="!salad.available">{{ salad.available ? 'Available' : 'Unavailable' }}</span></td>
                <td class="text-end">
                  <button class="btn btn-link text-decoration-none" (click)="toggle(salad)">Toggle</button>
                  <button class="btn btn-link text-decoration-none" (click)="edit(salad)">Edit</button>
                  <button class="btn btn-link text-danger text-decoration-none" (click)="remove(salad)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #empty>No salads found.</ng-template>
      </div>
    </div>
  `
})
export class MenuManagementComponent implements OnInit {
  private readonly api = inject(AppDataService);
  private readonly router = inject(Router);
  readonly salads = signal<MenuItem[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.api.adminMenu().subscribe((rows) => this.salads.set(rows));
  }

  edit(salad: MenuItem) {
    this.router.navigate(['/admin/menu/edit', salad.id], { state: { salad } });
  }

  toggle(salad: MenuItem) {
    this.api.toggleMenu(salad.id).subscribe(() => this.load());
  }

  remove(salad: MenuItem) {
    if (!window.confirm(`Delete ${salad.name}?`)) return;
    this.api.deleteMenu(salad.id).subscribe(() => this.load());
  }
}
