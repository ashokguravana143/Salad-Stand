import { Injectable, computed, effect, signal } from '@angular/core';

import { CartItem, MenuItem } from '../models/app.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsState = signal<CartItem[]>([]);

  readonly items = computed(() => this.itemsState());
  readonly total = computed(() => this.itemsState().reduce((sum, item) => sum + item.price * item.quantity, 0));
  readonly count = computed(() => this.itemsState().reduce((sum, item) => sum + item.quantity, 0));

  constructor(private readonly auth: AuthService) {
    effect(() => {
      // Re-read items from local storage whenever the current user changes.
      // Accessing currentUser() creates a dependency on that signal.
      const _ = this.auth.currentUser();
      this.itemsState.set(this.read());
    });
  }

  private getCartKey(): string {
    const user = this.auth.currentUser();
    return user ? `saladstand_cart_${user.id}` : 'saladstand_cart_guest';
  }

  add(menu: MenuItem, quantity = 1) {
    const items = this.itemsState().map(item => ({ ...item }));
    const existing = items.find((item) => item.menu_id === menu.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        menu_id: menu.id,
        name: menu.name,
        price: Number(menu.price),
        quantity,
        image_url: menu.image_url || menu.image_path
      });
    }
    this.save(items);
  }

  subtract(menuId: number) {
    const items = this.itemsState().map(item => ({ ...item }));
    const existing = items.find((item) => item.menu_id === menuId);
    if (existing) {
      existing.quantity -= 1;
      if (existing.quantity <= 0) {
        this.remove(menuId);
        return;
      }
      this.save(items);
    }
  }

  remove(menuId: number) {
    const items = this.itemsState().filter((item) => item.menu_id !== menuId);
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
    localStorage.setItem(this.getCartKey(), JSON.stringify(items));
  }

  private read(): CartItem[] {
    const raw = localStorage.getItem(this.getCartKey());
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  }
}
