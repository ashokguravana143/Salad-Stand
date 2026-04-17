import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AppDataService } from '../../core/services/app-data.service';
import { DeliveryBoy } from '../../core/models/app.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h1 class="display-6 fw-bold text-success text-center mb-4">Admin Dashboard</h1>
    <div class="row g-3 mb-4">
      <div class="col-md-6 col-xl-3" *ngFor="let card of cards">
        <a [routerLink]="card.link" class="card card-soft h-100 text-decoration-none text-dark">
          <div class="card-body text-center p-4">
            <div class="fs-2 mb-2">{{ card.icon }}</div>
            <div class="fw-semibold">{{ card.label }}</div>
          </div>
        </a>
      </div>
    </div>
    <div class="card card-soft">
      <div class="card-body p-4">
        <h2 class="h4 mb-3">Delivery Boys</h2>
        <div *ngIf="!deliveryBoys().length" class="text-secondary">No delivery boys found.</div>
        <div class="table-responsive" *ngIf="deliveryBoys().length">
          <table class="table align-middle">
            <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let boy of deliveryBoys()">
                <td>{{ boy.full_name }}</td>
                <td>{{ boy.email }}</td>
                <td><span class="badge" [class.text-bg-success]="boy.is_active" [class.text-bg-danger]="!boy.is_active">{{ boy.is_active ? 'Active' : 'Offline' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(AppDataService);
  readonly deliveryBoys = signal<DeliveryBoy[]>([]);

  readonly cards = [
    { label: 'Manage Orders', link: '/admin/orders', icon: '📦' },
    { label: 'Manage Menu', link: '/admin/menu', icon: '🥗' },
    { label: 'Manage Delivery Boys', link: '/admin/manage-dboy', icon: '🛵' },
    { label: 'Settings', link: '/admin/settings', icon: '⚙️' }
  ];

  ngOnInit(): void {
    this.api.deliveryBoys().subscribe((rows) => this.deliveryBoys.set(rows));
  }
}
