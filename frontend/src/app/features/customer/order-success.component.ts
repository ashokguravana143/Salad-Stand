import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-6">
        <div class="card card-soft text-center">
          <div class="card-body p-5">
            <div class="display-1 text-success mb-3">✓</div>
            <h1 class="h2 fw-bold text-success">Order Confirmed!</h1>
            <p class="text-secondary mb-4">Your order has been placed successfully. A delivery boy will be assigned shortly.</p>
            <a routerLink="/" class="btn btn-success btn-pill btn-lg">Go to Home</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrderSuccessComponent {}
