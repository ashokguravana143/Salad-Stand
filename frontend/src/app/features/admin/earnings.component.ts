import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { AppDataService } from '../../core/services/app-data.service';
import { DailyEarning } from '../../core/models/app.models';

@Component({
  selector: 'app-admin-earnings',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <h1 class="display-6 fw-bold text-success mb-2">Daily Earnings</h1>
    <p class="text-secondary mb-4">Showing totals for successfully delivered orders from the last 90 days.</p>
    <div *ngIf="!earnings().length" class="card card-soft text-center p-5">No delivered-order earnings found.</div>
    <div class="card card-soft" *ngIf="earnings().length">
      <div class="list-group list-group-flush">
        <div class="list-group-item py-3 d-flex justify-content-between align-items-center" *ngFor="let earning of earnings()">
          <div>
            <div class="fw-semibold">Delivered Orders</div>
            <small class="text-secondary">{{ earning.date | date:'dd MMM yyyy' }}</small>
          </div>
          <div class="price-tag">{{ earning.total_amount | currency:'INR':'symbol':'1.2-2' }}</div>
        </div>
      </div>
    </div>
  `
})
export class EarningsComponent implements OnInit {
  private readonly api = inject(AppDataService);
  readonly earnings = signal<DailyEarning[]>([]);

  ngOnInit(): void {
    this.api.adminEarnings().subscribe((rows) => this.earnings.set(rows));
  }
}
