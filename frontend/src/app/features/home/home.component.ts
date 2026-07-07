import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { LocationService } from '../../core/services/location.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  template: `
    <section class="hero-panel p-5 p-lg-6 mb-5">
      <div class="row align-items-center g-4">
        <div class="col-lg-7">
          <p class="text-uppercase small fw-semibold mb-2">Fresh. Healthy. Delivered.</p>
          <h1 class="display-4 fw-bold mb-3">Fresh fruit salads prepared fast and delivered with care.</h1>
          <p class="lead mb-4">Browse the menu, place your order, track delivery progress, or manage store operations by role.</p>
          <div class="d-flex flex-wrap gap-3">
            <a *ngIf="!auth.currentUser()" routerLink="/register" class="btn btn-light btn-pill fw-semibold">Get Started</a>
            <a *ngIf="auth.currentUser()?.role === 'ROLE_CUSTOMER'" routerLink="/menu" class="btn btn-light btn-pill fw-semibold">Start Ordering</a>
            <a *ngIf="auth.currentUser()?.role === 'ROLE_ADMIN'" routerLink="/admin/dashboard" class="btn btn-light btn-pill fw-semibold">Manage Store</a>
            <a *ngIf="auth.currentUser()?.role === 'ROLE_DELIVERY_BOY'" routerLink="/delivery/dashboard" class="btn btn-light btn-pill fw-semibold">Pick Orders</a>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="card card-soft bg-white text-dark">
            <div class="card-body p-4">
              <div class="row g-3 text-center">
                <div class="col-4">
                  <div class="fs-1">Fresh</div>
                  <div class="fw-semibold">Daily</div>
                </div>
                <div class="col-4">
                  <div class="fs-1">Fast</div>
                  <div class="fw-semibold">Local</div>
                </div>
                <div class="col-4">
                  <div class="fs-1">Safe</div>
                  <div class="fw-semibold">Secure</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section *ngIf="auth.currentUser()?.role === 'ROLE_CUSTOMER'" class="service-status-card card-soft p-4 mb-5">
      <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
        <div>
          <div class="eyebrow">Delivery zone</div>
          <h2 class="h4 mb-2">{{ statusTitle() }}</h2>
          <p class="mb-1">{{ statusMessage() }}</p>
          <small *ngIf="location.availability()" class="text-secondary">
            Delivery fee {{ location.availability()?.delivery_fee | currency:'INR':'symbol':'1.0-0' }} | ETA {{ location.availability()?.estimated_delivery_time_minutes }} min
          </small>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-success btn-pill" type="button" (click)="refreshLocation()" [disabled]="location.loading()">
            {{ location.loading() ? 'Checking...' : 'Use current location' }}
          </button>
          <a *ngIf="!location.orderingBlocked()" routerLink="/menu" class="btn btn-outline-success btn-pill">Browse menu</a>
        </div>
      </div>
    </section>

    <section class="row g-4">
      <div class="col-md-4" *ngFor="let item of highlights">
        <div class="card card-soft h-100">
          <div class="card-body p-4 text-center">
            <div class="fs-1 mb-3">{{ item.icon }}</div>
            <h3 class="h4">{{ item.title }}</h3>
            <p class="text-secondary mb-0">{{ item.text }}</p>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HomeComponent {
  readonly auth = inject(AuthService);
  readonly location = inject(LocationService);
  readonly statusTitle = computed(() => {
    if (this.location.permission() === 'loading') {
      return 'Checking service availability';
    }
    if (this.location.permission() === 'denied' || this.location.permission() === 'unsupported') {
      return 'Location access required';
    }
    if (this.location.availability() && !this.location.availability()?.available) {
      return 'Service unavailable for this area';
    }
    if (this.location.availability()?.available) {
      return 'Delivery available at your location';
    }
    return 'Enable location to start ordering';
  });
  readonly statusMessage = computed(() => this.location.message() || 'We use your location to verify whether delivery is available in your area.');
  readonly highlights = [
    { icon: '1', title: 'Fresh Ingredients', text: 'We handpick the best fruits daily to keep each bowl bright and crisp.' },
    { icon: '2', title: 'Prepared Fresh', text: 'Each order is prepared after acceptance so the texture and taste stay sharp.' },
    { icon: '3', title: 'Delivered to You', text: 'Delivery partners pick up ready orders and complete the last mile fast.' }
  ];

  refreshLocation() {
    void this.location.requestCurrentLocation(true);
  }
}
