import { Injectable } from '@angular/core';

import { ApiClientService } from '../http/api-client.service';
import { AppSettings, DailyEarning, DeliveryBoy, DeliveryEarningsResponse, MenuItem, Order } from '../models/app.models';

@Injectable({ providedIn: 'root' })
export class AppDataService {
  constructor(private readonly api: ApiClientService) {}

  publicSettings() {
    return this.api.get<AppSettings>('/settings/public');
  }

  menu() {
    return this.api.get<MenuItem[]>('/menu');
  }

  adminMenu() {
    return this.api.get<MenuItem[]>('/menu/admin');
  }

  myOrders() {
    return this.api.get<Order[]>('/customer/orders/my');
  }

  placeOrder(payload: { delivery_address: string; payment_method: string; items: { menu_id: number; quantity: number }[] }) {
    return this.api.post<Order>('/customer/orders', payload);
  }

  createPaymentOrder(payload: { delivery_address: string; items: { menu_id: number; quantity: number }[] }) {
    return this.api.post<Record<string, unknown>>('/customer/payments/create-order', payload);
  }

  verifyPayment(payload: unknown) {
    return this.api.post<Record<string, unknown>>('/customer/payments/verify', payload);
  }

  adminOrders() {
    return this.api.get<Order[]>('/admin/orders');
  }

  acceptOrder(orderId: number) {
    return this.api.post<Order>(`/admin/orders/${orderId}/accept`, {});
  }

  readyOrder(orderId: number) {
    return this.api.post<Order>(`/admin/orders/${orderId}/ready`, {});
  }

  createMenu(payload: Partial<MenuItem>) {
    return this.api.post<MenuItem>('/menu', payload);
  }

  updateMenu(menuId: number, payload: Partial<MenuItem>) {
    return this.api.put<MenuItem>(`/menu/${menuId}`, payload);
  }

  toggleMenu(menuId: number) {
    return this.api.post<MenuItem>(`/menu/${menuId}/toggle`, {});
  }

  deleteMenu(menuId: number) {
    return this.api.delete<void>(`/menu/${menuId}`);
  }

  deliveryBoys() {
    return this.api.get<DeliveryBoy[]>('/admin/delivery-boys');
  }

  createDeliveryBoy(payload: { full_name: string; email: string; phone_number: string; password: string }) {
    return this.api.post<DeliveryBoy>('/admin/delivery-boys', payload);
  }

  toggleDeliveryBoy(userId: number) {
    return this.api.post<DeliveryBoy>(`/admin/delivery-boys/${userId}/toggle`, {});
  }

  deleteDeliveryBoy(userId: number) {
    return this.api.delete<{ message: string }>(`/admin/delivery-boys/${userId}`);
  }

  adminSettings() {
    return this.api.get<AppSettings>('/admin/settings');
  }

  saveAdminSettings(payload: { is_cod_available: boolean }) {
    return this.api.put<AppSettings>('/admin/settings', payload);
  }

  adminEarnings() {
    return this.api.get<DailyEarning[]>('/admin/earnings');
  }

  readyToPickOrders() {
    return this.api.get<Order[]>('/delivery/dashboard');
  }

  myDeliveries() {
    return this.api.get<Order[]>('/delivery/my-deliveries');
  }

  pickup(orderId: number) {
    return this.api.post<Order>(`/delivery/pickup/${orderId}`, {});
  }

  deliver(orderId: number) {
    return this.api.post<Order>(`/delivery/deliver/${orderId}`, {});
  }

  myEarnings() {
    return this.api.get<DeliveryEarningsResponse>('/delivery/my-earnings');
  }
}
