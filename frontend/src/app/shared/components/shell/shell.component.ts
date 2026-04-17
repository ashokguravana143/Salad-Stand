import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="bg-white sticky-top shadow-sm">
      <nav class="navbar navbar-expand-lg">
        <div class="container py-2">
          <a routerLink="/" class="navbar-brand fw-bold fs-3 text-success">Salad<span class="text-warning">Stand</span></a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navMenu">
            <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-2">
              <ng-container *ngIf="user()?.role === 'ROLE_CUSTOMER'">
                <li class="nav-item"><a routerLink="/menu" routerLinkActive="active" class="nav-link">Order Now</a></li>
                <li class="nav-item"><a routerLink="/orders/my" routerLinkActive="active" class="nav-link">My Orders</a></li>
                <li class="nav-item">
                  <a routerLink="/cart" routerLinkActive="active" class="nav-link">Cart <span class="badge text-bg-success">{{ cartCount() }}</span></a>
                </li>
              </ng-container>
              <ng-container *ngIf="user()?.role === 'ROLE_ADMIN'">
                <li class="nav-item"><a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link">Dashboard</a></li>
                <li class="nav-item"><a routerLink="/admin/earnings" routerLinkActive="active" class="nav-link">Earnings</a></li>
                <li class="nav-item"><a routerLink="/admin/settings" routerLinkActive="active" class="nav-link">Settings</a></li>
              </ng-container>
              <ng-container *ngIf="user()?.role === 'ROLE_DELIVERY_BOY'">
                <li class="nav-item"><a routerLink="/delivery/dashboard" routerLinkActive="active" class="nav-link">Dashboard</a></li>
                <li class="nav-item"><a routerLink="/delivery/my-deliveries" routerLinkActive="active" class="nav-link">My Deliveries</a></li>
                <li class="nav-item"><a routerLink="/delivery/my-earnings" routerLinkActive="active" class="nav-link">My Earnings</a></li>
              </ng-container>
              <ng-container *ngIf="!user(); else authed">
                <li class="nav-item"><a routerLink="/register" class="btn btn-success btn-pill me-2">Register</a></li>
                <li class="nav-item"><a routerLink="/login" class="btn btn-outline-success btn-pill">Login</a></li>
              </ng-container>
              <ng-template #authed>
                <li class="nav-item"><button class="btn btn-outline-danger btn-pill" (click)="logout()">Logout</button></li>
              </ng-template>
            </ul>
          </div>
        </div>
      </nav>
    </header>

    <main class="page-shell py-4">
      <div class="container">
        <router-outlet />
      </div>
    </main>

    <footer class="bg-success text-white py-4 mt-auto">
      <div class="container text-center small">&copy; 2025 SaladStand | Freshly prepared and delivered.</div>
    </footer>
  `
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);

  readonly user = this.auth.currentUser;
  readonly cartCount = computed(() => this.cart.count());

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
