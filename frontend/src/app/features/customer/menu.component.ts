import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AppDataService } from '../../core/services/app-data.service';
import { CartService } from '../../core/services/cart.service';
import { MenuItem } from '../../core/models/app.models';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="text-center mb-4">
      <h1 class="display-6 fw-bold text-success">Our Menu</h1>
      <p class="text-secondary">Fresh salads, ready for delivery.</p>
    </div>
    <div *ngIf="message()" class="alert alert-success">{{ message() }}</div>
    <div class="row g-4" *ngIf="salads().length; else empty">
      <div class="col-md-6 col-lg-4" *ngFor="let salad of salads()">
        <div class="card card-soft h-100 overflow-hidden">
          <img [src]="salad.image_path ? apiUrl + salad.image_path : placeholder" class="card-img-top" style="height: 220px; object-fit: cover" [alt]="salad.name" />
          <div class="card-body d-flex flex-column">
            <h2 class="h4 text-success">{{ salad.name }}</h2>
            <p class="text-secondary flex-grow-1">{{ salad.description }}</p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="price-tag">{{ salad.price | currency:'INR':'symbol':'1.2-2' }}</span>
              <button class="btn btn-success btn-pill" [disabled]="!salad.available" (click)="add(salad)">
                {{ salad.available ? 'Add to Cart' : 'Unavailable' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ng-template #empty>
      <div class="card card-soft text-center p-5">No salads are available at the moment.</div>
    </ng-template>
  `
})
export class MenuComponent implements OnInit {
  private readonly api = inject(AppDataService);
  private readonly cart = inject(CartService);

  readonly salads = signal<MenuItem[]>([]);
  readonly message = signal('');
  readonly placeholder = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80';
  readonly apiBaseUrl = environment.apiBaseUrl;
  readonly apiUrl = environment.apiurl;;

  ngOnInit(): void {
    this.api.menu().subscribe((rows) => this.salads.set(rows));
  }

  add(salad: MenuItem) {
    this.cart.add(salad);
    this.message.set('Salad added to cart!');
    setTimeout(() => this.message.set(''), 2500);
  }
}
