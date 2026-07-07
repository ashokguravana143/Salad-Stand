import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { LocationService } from '../../core/services/location.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-xl-9">
        <h1 class="display-6 fw-bold text-success text-center mb-4">Your Shopping Cart</h1>
        
        <div *ngIf="!cart.items().length" class="card card-soft text-center p-5">
          <h2 class="h4">Your cart is empty.</h2>
          <p class="text-secondary">Add some delicious salads to start your order.</p>
          <a routerLink="/menu" class="btn btn-success btn-pill align-self-center">Browse Menu</a>
        </div>
        
        <div *ngIf="cart.items().length" class="card card-soft">
          <div class="card-body p-4">
            <div class="d-flex align-items-center justify-content-between border-bottom py-3" *ngFor="let item of cart.items()">
              <div>
                <h3 class="h5 mb-1">{{ item.name }}</h3>
                <div class="d-flex align-items-center gap-2 mt-2">
                  <button type="button" class="btn btn-sm btn-outline-secondary btn-pill py-0 px-2" (click)="cart.subtract(item.menu_id)">&minus;</button>
                  <span class="fw-semibold px-1">{{ item.quantity }}</span>
                  <button type="button" class="btn btn-sm btn-outline-success btn-pill py-0 px-2" (click)="addToCart(item)">&plus;</button>
                  <button type="button" class="btn btn-sm btn-outline-danger btn-pill ms-3 py-1 px-2 d-flex align-items-center gap-1" (click)="cart.remove(item.menu_id)">
                    <span>&#128465;</span> Remove
                  </button>
                </div>
              </div>
              <div class="price-tag fw-bold text-success">{{ item.price * item.quantity | currency:'INR':'symbol':'1.2-2' }}</div>
            </div>
            
            <div class="d-flex justify-content-between align-items-center pt-4">
              <span class="h4 mb-0">Total</span>
              <span class="h4 text-success mb-0 fw-bold">{{ cart.total() | currency:'INR':'symbol':'1.2-2' }}</span>
            </div>
            
            <div *ngIf="location.orderingBlocked()" class="alert alert-warning mt-4 mb-0">
              {{ location.message() || 'Service not available at your location.' }}
            </div>
            
            <div class="text-center pt-4">
              <a routerLink="/checkout" class="btn btn-success btn-pill btn-lg px-5" [class.disabled]="location.orderingBlocked()" [attr.aria-disabled]="location.orderingBlocked()">
                Proceed to Checkout
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CartComponent {
  readonly cart = inject(CartService);
  readonly location = inject(LocationService);

  addToCart(item: any) {
    this.cart.add({
      id: item.menu_id,
      name: item.name,
      price: item.price,
      available: true,
      image_url: item.image_url,
      image_path: null
    });
  }
}
