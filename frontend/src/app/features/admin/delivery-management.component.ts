import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AppDataService } from '../../core/services/app-data.service';
import { DeliveryBoy } from '../../core/models/app.models';

@Component({
  selector: 'app-delivery-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="display-6 fw-bold text-success mb-0">Manage Delivery Boys</h1>
      <a routerLink="/admin/delivery-boys/add" class="btn btn-success btn-pill">Add New Delivery Boy</a>
    </div>
    <div class="card card-soft">
      <div class="card-body p-4">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead><tr><th>Name</th><th>Email</th><th>Status</th><th class="text-end">Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let boy of deliveryBoys()">
                <td>{{ boy.full_name }}</td>
                <td>{{ boy.email }}</td>
                <td><span class="badge" [class.text-bg-success]="boy.is_active" [class.text-bg-danger]="!boy.is_active">{{ boy.is_active ? 'Active' : 'Offline' }}</span></td>
                <td class="text-end">
                  <button class="btn btn-link text-decoration-none" (click)="toggle(boy)">{{ boy.is_active ? 'Block' : 'Unblock' }}</button>
                  <button class="btn btn-link text-danger text-decoration-none" (click)="remove(boy)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class DeliveryManagementComponent implements OnInit {
  private readonly api = inject(AppDataService);
  readonly deliveryBoys = signal<DeliveryBoy[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.api.deliveryBoys().subscribe((rows) => this.deliveryBoys.set(rows));
  }

  toggle(boy: DeliveryBoy) {
    this.api.toggleDeliveryBoy(boy.id).subscribe(() => this.load());
  }

  remove(boy: DeliveryBoy) {
    if (!window.confirm(`Delete ${boy.full_name}?`)) return;
    this.api.deleteDeliveryBoy(boy.id).subscribe(() => this.load());
  }
}
