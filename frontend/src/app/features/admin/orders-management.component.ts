import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { AppDataService } from '../../core/services/app-data.service';
import { Order } from '../../core/models/app.models';

@Component({
  selector: 'app-orders-management',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <h1 class="display-6 fw-bold text-success text-center mb-4">Manage Orders</h1>
    <div *ngIf="!orders().length" class="card card-soft text-center p-5">No placed orders need action right now.</div>
    <div class="d-grid gap-3" *ngIf="orders().length">
      <div class="card card-soft" *ngFor="let order of orders()">
        <div class="card-body d-flex flex-column flex-md-row justify-content-between gap-3">
          <div>
            <h2 class="h4">Order #{{ order.id }}</h2>
            <p class="mb-1"><strong>Customer:</strong> {{ order.customer.full_name }}</p>
            <p class="mb-1"><strong>Total:</strong> {{ order.total_amount | currency:'INR':'symbol':'1.2-2' }}</p>
            <p class="mb-1"><strong>Mode:</strong> {{ order.payment_method === 'ONLINE' ? 'Online' : 'Cash on Delivery' }}</p>
            <p class="mb-1"><strong>Address:</strong> {{ order.delivery_address }}</p>
            <p class="mb-0"><strong>Placed:</strong> {{ order.order_time | date:'dd-MMM-yyyy HH:mm' }}</p>
          </div>
          <div class="d-flex align-items-center">
            <button *ngIf="order.status === 'PENDING'" class="btn btn-primary btn-pill" (click)="accept(order.id)">Accept Order</button>
            <button *ngIf="order.status === 'ACCEPTED'" class="btn btn-success btn-pill" (click)="ready(order.id)">Mark Ready to Pick</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrdersManagementComponent implements OnInit {
  private readonly api = inject(AppDataService);
  readonly orders = signal<Order[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.api.adminOrders().subscribe((rows) => this.orders.set(rows));
  }

  accept(orderId: number) {
    this.api.acceptOrder(orderId).subscribe(() => this.load());
  }

  ready(orderId: number) {
    this.api.readyOrder(orderId).subscribe(() => this.load());
  }
}
