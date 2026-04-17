import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { AppDataService } from '../../core/services/app-data.service';
import { DeliveryEarningsResponse } from '../../core/models/app.models';

@Component({
  selector: 'app-delivery-earnings',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <h1 class="display-6 fw-bold text-success text-center mb-4">My Earnings</h1>
    <div class="card card-soft text-center mb-4">
      <div class="card-body p-4">
        <div class="text-secondary">Total Commission Earnings</div>
        <div class="display-6 text-success fw-bold">{{ (earnings()?.total_earnings || 0) | currency:'INR':'symbol':'1.2-2' }}</div>
      </div>
    </div>
    <div *ngIf="!(earnings()?.delivery_earnings?.length)" class="card card-soft text-center p-5">You have no delivered orders yet.</div>
    <div class="d-grid gap-3" *ngIf="earnings()?.delivery_earnings?.length">
      <div class="card card-soft" *ngFor="let earning of earnings()!.delivery_earnings">
        <div class="card-body d-flex justify-content-between align-items-center gap-3">
          <div>
            <h2 class="h5 mb-1">Order #{{ earning.order_id }}</h2>
            <p class="mb-1"><strong>Address:</strong> {{ earning.delivery_address }}</p>
            <p class="mb-0 text-secondary">Delivered On: {{ earning.delivered_at | date:'dd-MMM-yyyy HH:mm' }}</p>
          </div>
          <div class="text-end">
            <div>Amount: {{ earning.amount | currency:'INR':'symbol':'1.2-2' }}</div>
            <div class="h5 text-success mb-0">Commission: {{ earning.commission | currency:'INR':'symbol':'1.2-2' }}</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EarningsComponent implements OnInit {
  private readonly api = inject(AppDataService);
  readonly earnings = signal<DeliveryEarningsResponse | null>(null);

  ngOnInit(): void {
    this.api.myEarnings().subscribe((rows) => this.earnings.set(rows));
  }
}
