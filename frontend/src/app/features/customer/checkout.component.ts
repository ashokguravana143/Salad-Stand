import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AppDataService } from '../../core/services/app-data.service';
import { CartService } from '../../core/services/cart.service';
import { AppSettings } from '../../core/models/app.models';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      on(event: string, callback: () => void): void;
      open(): void;
    };
  }
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  template: `
    <div class="row justify-content-center">
      <div class="col-xl-8">
        <h1 class="display-6 fw-bold text-success text-center mb-4">Checkout</h1>
        <div class="card card-soft">
          <div class="card-body p-4 p-lg-5">
            <div *ngIf="!cart.items().length" class="text-center">
              <p>Your cart is empty.</p>
            </div>
            <ng-container *ngIf="cart.items().length">
              <div class="d-flex justify-content-between border-bottom py-3" *ngFor="let item of cart.items()">
                <div>
                  <div class="fw-semibold">{{ item.name }}</div>
                  <small class="text-secondary">Quantity: {{ item.quantity }}</small>
                </div>
                <span class="price-tag">{{ item.price * item.quantity | currency:'INR':'symbol':'1.2-2' }}</span>
              </div>
              <div class="d-flex justify-content-between h4 pt-4">
                <span>Total</span>
                <span class="text-success">{{ cart.total() | currency:'INR':'symbol':'1.2-2' }}</span>
              </div>
              <div *ngIf="error()" class="alert alert-danger mt-4">{{ error() }}</div>
              <div *ngIf="!settings()?.razorpay_configured" class="alert alert-warning mt-4">Online payment is not configured yet.</div>
              <form [formGroup]="form" class="mt-4">
                <div class="mb-3">
                  <label class="form-label">Delivery Address</label>
                  <textarea class="form-control" rows="3" formControlName="delivery_address"></textarea>
                </div>
                <div class="mb-4">
                  <label class="form-label d-block">Payment Method</label>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" value="ONLINE" formControlName="payment_method" id="paymentOnline" />
                    <label class="form-check-label" for="paymentOnline">Online Payment</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" value="COD" formControlName="payment_method" id="paymentCod" [disabled]="!settings()?.is_cod_available" />
                    <label class="form-check-label" for="paymentCod">Cash on Delivery <span *ngIf="!settings()?.is_cod_available">(Unavailable)</span></label>
                  </div>
                </div>
                <div class="d-flex flex-column flex-sm-row justify-content-center gap-3">
                  <button type="button" class="btn btn-success btn-pill btn-lg" *ngIf="form.value.payment_method === 'COD'" (click)="placeCodOrder()" [disabled]="loading()">Confirm Order</button>
                  <button type="button" class="btn btn-primary btn-pill btn-lg" *ngIf="form.value.payment_method === 'ONLINE'" (click)="startOnlinePayment()" [disabled]="loading() || !settings()?.razorpay_configured">Make Payment</button>
                </div>
              </form>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CheckoutComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AppDataService);
  private readonly router = inject(Router);

  readonly cart = inject(CartService);
  readonly settings = signal<AppSettings | null>(null);
  readonly error = signal('');
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    delivery_address: ['', [Validators.required]],
    payment_method: ['ONLINE', [Validators.required]]
  });

  ngOnInit(): void {
    this.api.publicSettings().subscribe((settings) => {
      this.settings.set(settings);
      this.form.patchValue({ payment_method: settings.is_cod_available ? 'COD' : 'ONLINE' });
    });
  }

  placeCodOrder() {
    this.loading.set(true);
    this.error.set('');
    this.api.placeOrder({
      delivery_address: this.form.getRawValue().delivery_address,
      payment_method: 'COD',
      items: this.cart.toApiPayload()
    }).subscribe({
      next: () => {
        this.cart.clear();
        this.loading.set(false);
        this.router.navigateByUrl('/order-success');
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error.error?.detail ?? 'Unable to place order.');
      }
    });
  }

  startOnlinePayment() {
    this.loading.set(true);
    this.error.set('');
    this.api.createPaymentOrder({
      delivery_address: this.form.getRawValue().delivery_address,
      items: this.cart.toApiPayload()
    }).subscribe({
      next: async (response) => {
        this.loading.set(false);
        await this.ensureRazorpayScript();
        const options = {
          key: response['key'],
          amount: response['amount'],
          currency: response['currency'],
          name: response['name'],
          description: response['description'],
          order_id: response['orderId'],
          prefill: {
            name: response['customerName'],
            email: response['customerEmail'],
            contact: response['customerPhone']
          },
          theme: { color: '#198754' },
          handler: (payment: Record<string, string>) => {
            this.api.verifyPayment({
              delivery_address: this.form.getRawValue().delivery_address,
              razorpay_order_id: payment['razorpay_order_id'],
              razorpay_payment_id: payment['razorpay_payment_id'],
              razorpay_signature: payment['razorpay_signature'],
              items: this.cart.toApiPayload()
            }).subscribe(() => {
              this.cart.clear();
              this.router.navigateByUrl('/order-success');
            });
          },
          modal: {
            ondismiss: () => this.error.set('Payment was not completed. Please try again.')
          }
        };
        const RazorpayCtor = window.Razorpay;
        if (!RazorpayCtor) {
          this.error.set('Unable to load payment gateway right now.');
          return;
        }
        const razorpay = new RazorpayCtor(options);
        razorpay.on('payment.failed', () => this.error.set('Payment was not completed. Please try again.'));
        razorpay.open();
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error.error?.detail ?? 'Unable to start payment.');
      }
    });
  }

  private async ensureRazorpayScript() {
    if (window.Razorpay) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });
  }
}
