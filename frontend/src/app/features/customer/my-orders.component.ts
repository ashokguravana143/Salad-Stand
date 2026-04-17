import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AppDataService } from '../../core/services/app-data.service';
import { Order } from '../../core/models/app.models';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  template: `
    <h1 class="display-6 fw-bold text-success text-center mb-4">My Orders</h1>
    <div *ngIf="!orders().length" class="card card-soft text-center p-5">
      <h2 class="h4">You haven't placed any orders yet.</h2>
      <a routerLink="/menu" class="btn btn-success btn-pill mt-3">Start an Order</a>
    </div>
    <div class="d-grid gap-4" *ngIf="orders().length">
      <div class="card card-soft" *ngFor="let order of orders()">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="h4 text-success mb-0">Order #{{ order.id }}</h2>
            <span class="badge text-bg-light border">{{ order.status }}</span>
          </div>
          <p class="mb-1"><strong>Order Time:</strong> {{ order.order_time | date:'dd-MMM-yyyy HH:mm' }}</p>
          <p class="mb-1"><strong>Total:</strong> {{ order.total_amount | currency:'INR':'symbol':'1.2-2' }}</p>
          <p class="mb-1"><strong>Mode of Payment:</strong> {{ order.payment_method === 'ONLINE' ? 'Online' : 'Cash on Delivery' }}</p>
          <p class="mb-3"><strong>Delivery Address:</strong> {{ order.delivery_address }}</p>
          <div class="fw-semibold mb-2">Items</div>
          <ul class="mb-0">
            <li *ngFor="let item of order.items">{{ item.quantity }}x {{ item.salad_name }} ({{ item.price | currency:'INR':'symbol':'1.2-2' }})</li>
          </ul>
        </div>
      </div>
    </div>
  `
})
export class MyOrdersComponent implements OnInit {
  private readonly api = inject(AppDataService);
  readonly orders = signal<Order[]>([]);

  ngOnInit(): void {
    this.api.myOrders().subscribe((rows) => this.orders.set(rows));
  }
}
