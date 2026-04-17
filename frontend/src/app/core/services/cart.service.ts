import { Injectable, computed, signal } from '@angular/core';

import { CartItem, MenuItem } from '../models/app.models';

const CART_KEY = 'saladstand_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsState = signal<CartItem[]>(this.read());

  readonly items = computed(() => this.itemsState());
  readonly total = computed(() => this.itemsState().reduce((sum, item) => sum + item.price * item.quantity, 0));
  readonly count = computed(() => this.itemsState().reduce((sum, item) => sum + item.quantity, 0));

  add(menu: MenuItem, quantity = 1) {
    const items = [...this.itemsState()];
    const existing = items.find((item) => item.menu_id === menu.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        menu_id: menu.id,
        name: menu.name,
        price: Number(menu.price),
        quantity,
        image_url: menu.image_url
      });
    }
    this.save(items);
  }

  clear() {
    this.save([]);
  }

  toApiPayload() {
    return this.itemsState().map((item) => ({ menu_id: item.menu_id, quantity: item.quantity }));
  }

  private save(items: CartItem[]) {
    this.itemsState.set(items);
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  private read(): CartItem[] {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  }
}
