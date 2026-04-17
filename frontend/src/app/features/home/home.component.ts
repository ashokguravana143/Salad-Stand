import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
                  <div class="fs-1">🍓</div>
                  <div class="fw-semibold">Fresh</div>
                </div>
                <div class="col-4">
                  <div class="fs-1">🚴</div>
                  <div class="fw-semibold">Fast</div>
                </div>
                <div class="col-4">
                  <div class="fs-1">💳</div>
                  <div class="fw-semibold">Secure</div>
                </div>
              </div>
            </div>
          </div>
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
  readonly highlights = [
    { icon: '🍍', title: 'Fresh Ingredients', text: 'We handpick the best fruits daily to keep each bowl bright and crisp.' },
    { icon: '👨‍🍳', title: 'Prepared Fresh', text: 'Each order is prepared after acceptance so the texture and taste stay sharp.' },
    { icon: '🏡', title: 'Delivered to You', text: 'Delivery partners pick up ready orders and complete the last mile fast.' }
  ];
}
