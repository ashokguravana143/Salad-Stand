import { CommonModule, CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AddressLabel, AddressRecord, AppSettings } from '../../core/models/app.models';
import { AppDataService } from '../../core/services/app-data.service';
import { CartService } from '../../core/services/cart.service';
import { GoogleMapsService, PlaceLocationResult, PlaceSuggestion } from '../../core/services/google-maps.service';
import { LocationService } from '../../core/services/location.service';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      on(event: string, callback: () => void): void;
      open(): void;
    };
    google?: any;
  }
}

const RECENT_ADDRESS_KEY = 'saladstand_recent_addresses';
const FALLBACK_LATITUDE = 12.9716;
const FALLBACK_LONGITUDE = 77.5946;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  template: `
    <form [formGroup]="form" class="row justify-content-center">
      <div class="col-xl-10">
        <div class="text-center mb-4">
          <h1 class="display-6 fw-bold text-success">Checkout</h1>
          <p class="text-secondary">Confirm your location, complete the address, and place the order with confidence.</p>
        </div>

        <div *ngIf="!cart.items().length" class="card card-soft text-center p-5">
          <p class="mb-0">Your cart is empty.</p>
        </div>

        <div *ngIf="cart.items().length" class="row g-4">
          <div class="col-lg-7">
            <div class="card card-soft h-100">
              <div class="card-body p-4 p-lg-5">
                <div class="eyebrow mb-2">Delivery address</div>
                <div class="checkout-status mb-4" [class.is-blocked]="isDeliveryBlocked()">
                  <div class="fw-semibold">{{ availabilityHeadline() }}</div>
                  <small>{{ availabilityMessage() }}</small>
                </div>

                <div *ngIf="selectedAddress()" class="selected-address-card mb-4">
                  <div class="d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <div class="address-pill mb-2">{{ selectedAddress()?.label }}</div>
                      <div class="fw-semibold">{{ selectedAddress()?.door_flat_no }}, {{ selectedAddress()?.street_name }}</div>
                      <div class="text-secondary">{{ selectedAddress()?.formatted_address }}</div>
                      <div class="text-secondary">{{ selectedAddress()?.city }} - {{ selectedAddress()?.pincode }}</div>
                    </div>
                    <button type="button" class="btn btn-outline-success btn-pill" (click)="editingAddress.set(true)">Change</button>
                  </div>
                </div>

                <div *ngIf="recentAddresses().length" class="mb-4">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <h2 class="h6 mb-0">Recent addresses</h2>
                    <small class="text-secondary">Quick access</small>
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <button type="button" class="btn btn-light btn-pill recent-chip" *ngFor="let address of recentAddresses()" (click)="selectSavedAddress(address)">
                      {{ address.label }} - {{ address.city }}
                    </button>
                  </div>
                </div>

                <div *ngIf="editingAddress()">
                  <div *ngIf="savedAddresses().length" class="mb-4">
                    <h2 class="h6 mb-3">Saved addresses</h2>
                    <div class="row g-3">
                      <div class="col-md-6" *ngFor="let address of savedAddresses()">
                        <button type="button" class="saved-address-card w-100 text-start" (click)="selectSavedAddress(address)">
                          <div class="address-pill mb-2">{{ address.label }}</div>
                          <div class="fw-semibold">{{ address.door_flat_no }}, {{ address.street_name }}</div>
                          <div class="small text-secondary">{{ address.city }} - {{ address.pincode }}</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="row g-3">
                    <div class="col-12">
                      <label class="form-label">Search address</label>
                      <div class="position-relative">
                        <input class="form-control form-control-lg" type="text" formControlName="formatted_address" placeholder="Search with Google Maps" (input)="onAddressSearch()" />
                        <div *ngIf="suggestions().length" class="autocomplete-panel">
                          <button type="button" class="autocomplete-option" *ngFor="let suggestion of suggestions()" (click)="chooseSuggestion(suggestion)">
                            <div class="fw-semibold">{{ suggestion.primaryText }}</div>
                            <small>{{ suggestion.secondaryText || suggestion.description }}</small>
                          </button>
                        </div>
                      </div>
                      <div *ngIf="!mapsEnabled()" class="form-text text-warning">Add a Google Maps API key in the frontend environment file to enable autocomplete and map picker.</div>
                    </div>

                    <div class="col-12 d-flex flex-wrap gap-2">
                      <button type="button" class="btn btn-outline-success btn-pill" (click)="useCurrentLocation()" [disabled]="location.loading()">
                        Use current location
                      </button>
                      <button type="button" class="btn btn-outline-dark btn-pill" (click)="toggleMapPicker()">
                        {{ mapVisible() ? 'Hide map picker' : 'Pick on map' }}
                      </button>
                    </div>

                    <div class="col-12" *ngIf="mapVisible()">
                      <div #mapCanvas class="map-canvas"></div>
                      <small class="text-secondary d-block mt-2">Tap to drop the marker on your delivery point.</small>
                    </div>

                    <div class="col-md-4">
                      <label class="form-label">Save as</label>
                      <select class="form-select" formControlName="label">
                        <option value="HOME">Home</option>
                        <option value="WORK">Work</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Door / Flat No</label>
                      <input class="form-control" type="text" formControlName="door_flat_no" />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Street name</label>
                      <input class="form-control" type="text" formControlName="street_name" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Landmark</label>
                      <input class="form-control" type="text" formControlName="landmark" />
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">City</label>
                      <input class="form-control" type="text" formControlName="city" />
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">Pincode</label>
                      <input class="form-control" type="text" formControlName="pincode" />
                    </div>
                    <div class="col-md-6">
                      <div class="form-check mt-2">
                        <input class="form-check-input" type="checkbox" id="saveAddress" formControlName="save_address" />
                        <label class="form-check-label" for="saveAddress">Save this address</label>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-check mt-2">
                        <input class="form-check-input" type="checkbox" id="defaultAddress" formControlName="is_default" />
                        <label class="form-check-label" for="defaultAddress">Make default</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div *ngIf="error()" class="alert alert-danger mt-4">{{ error() }}</div>
              </div>
            </div>
          </div>

          <div class="col-lg-5">
            <div class="card card-soft sticky-summary">
              <div class="card-body p-4">
                <div class="eyebrow mb-2">Order summary</div>
                <div class="d-flex justify-content-between border-bottom py-3" *ngFor="let item of cart.items()">
                  <div>
                    <div class="fw-semibold">{{ item.name }}</div>
                    <small class="text-secondary">Qty {{ item.quantity }}</small>
                  </div>
                  <span class="price-tag">{{ item.price * item.quantity | currency:'INR':'symbol':'1.2-2' }}</span>
                </div>

                <div class="summary-row mt-4">
                  <span>Items total</span>
                  <strong>{{ cart.total() | currency:'INR':'symbol':'1.2-2' }}</strong>
                </div>
                <div class="summary-row">
                  <span>Delivery fee</span>
                  <strong>{{ deliveryFee() | currency:'INR':'symbol':'1.2-2' }}</strong>
                </div>
                <div class="summary-row">
                  <span>ETA</span>
                  <strong>{{ etaMinutes() }} min</strong>
                </div>
                <div class="summary-row summary-total">
                  <span>Payable now</span>
                  <strong>{{ payableTotal() | currency:'INR':'symbol':'1.2-2' }}</strong>
                </div>

                <div *ngIf="selectedAddressSummary()" class="selected-address-card my-4">
                  <div class="fw-semibold mb-1">Delivering to</div>
                  <div>{{ selectedAddressSummary() }}</div>
                </div>

                <div *ngIf="!settings()?.razorpay_configured" class="alert alert-warning">Online payment is not configured yet.</div>

                <div class="mb-4">
                  <label class="form-label d-block">Payment method</label>
                  <div class="payment-toggle">
                    <label class="payment-option" [class.active]="form.value.payment_method === 'ONLINE'">
                      <input type="radio" value="ONLINE" formControlName="payment_method" />
                      <span>Pay online</span>
                    </label>
                    <label class="payment-option" [class.active]="form.value.payment_method === 'COD'" [class.disabled]="!settings()?.is_cod_available">
                      <input type="radio" value="COD" formControlName="payment_method" [disabled]="!settings()?.is_cod_available" />
                      <span>Cash on delivery</span>
                    </label>
                  </div>
                </div>

                <button type="button" class="btn btn-success btn-pill btn-lg w-100" *ngIf="form.value.payment_method === 'COD'" (click)="placeCodOrder()" [disabled]="placeOrderDisabled()">
                  {{ loading() ? 'Placing order...' : 'Place order' }}
                </button>
                <button type="button" class="btn btn-primary btn-pill btn-lg w-100" *ngIf="form.value.payment_method === 'ONLINE'" (click)="startOnlinePayment()" [disabled]="placeOrderDisabled() || !settings()?.razorpay_configured">
                  {{ loading() ? 'Starting payment...' : 'Pay and place order' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  `
})
export class CheckoutComponent implements OnInit, AfterViewInit {
  @ViewChild('mapCanvas') mapCanvas?: ElementRef<HTMLDivElement>;

  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AppDataService);
  private readonly router = inject(Router);
  private readonly maps = inject(GoogleMapsService);

  readonly cart = inject(CartService);
  readonly location = inject(LocationService);
  readonly settings = signal<AppSettings | null>(null);
  readonly savedAddresses = signal<AddressRecord[]>([]);
  readonly recentAddresses = signal<AddressRecord[]>([]);
  readonly suggestions = signal<PlaceSuggestion[]>([]);
  readonly selectedAddress = signal<AddressRecord | null>(null);
  readonly editingAddress = signal(true);
  readonly mapVisible = signal(false);
  readonly mapsEnabled = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly deliveryFee = signal(0);
  readonly etaMinutes = signal(25);

  readonly form = this.fb.nonNullable.group({
    formatted_address: ['', [Validators.required, Validators.minLength(5)]],
    door_flat_no: ['', [Validators.required]],
    street_name: ['', [Validators.required]],
    landmark: [''],
    city: ['', [Validators.required]],
    pincode: ['', [Validators.required, Validators.minLength(4)]],
    latitude: [0, [Validators.required]],
    longitude: [0, [Validators.required]],
    label: ['HOME' as AddressLabel, [Validators.required]],
    save_address: [true],
    is_default: [false],
    payment_method: ['ONLINE', [Validators.required]]
  });

  ngOnInit(): void {
    this.api.publicSettings().subscribe((settings) => {
      this.settings.set(settings);
      this.form.patchValue({ payment_method: settings.is_cod_available ? 'COD' : 'ONLINE' });
    });

    this.api.myAddresses().subscribe((addresses) => {
      this.savedAddresses.set(addresses);
      this.refreshRecentAddresses();
      const defaultAddress = addresses.find((address) => address.is_default) ?? addresses[0];
      if (defaultAddress) {
        this.selectSavedAddress(defaultAddress);
      } else if (this.location.coordinates()) {
        void this.useCurrentLocation();
      } else {
        this.deliveryFee.set(this.location.availability()?.delivery_fee ?? 0);
        this.etaMinutes.set(this.location.availability()?.estimated_delivery_time_minutes ?? 25);
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    this.mapsEnabled.set(!!(await this.maps.load()));
  }

  onAddressSearch() {
    void this.fetchSuggestions(this.form.controls.formatted_address.value);
  }

  async chooseSuggestion(suggestion: PlaceSuggestion) {
    const details = await this.maps.getPlaceDetails(suggestion.placeId);
    if (!details) {
      this.error.set('Unable to load the selected address.');
      return;
    }
    await this.applyPlaceResult(details);
  }

  async useCurrentLocation() {
    await this.location.ensureInitialized();
    const coordinates = this.location.coordinates();
    if (!coordinates) {
      this.error.set(this.location.message() || 'Location access is required to use this service.');
      return;
    }
    const details = await this.maps.reverseGeocode(coordinates.latitude, coordinates.longitude);
    if (details) {
      await this.applyPlaceResult(details);
      return;
    }
    this.form.patchValue({ latitude: coordinates.latitude, longitude: coordinates.longitude });
    await this.syncAvailability(coordinates.latitude, coordinates.longitude);
  }

  async toggleMapPicker() {
    this.mapVisible.set(!this.mapVisible());
    if (this.mapVisible()) {
      setTimeout(() => void this.initializeMap(), 0);
    }
  }

  selectSavedAddress(address: AddressRecord) {
    this.selectedAddress.set(address);
    this.editingAddress.set(false);
    this.form.patchValue({
      formatted_address: address.formatted_address,
      door_flat_no: address.door_flat_no,
      street_name: address.street_name,
      landmark: address.landmark ?? '',
      city: address.city,
      pincode: address.pincode,
      latitude: address.latitude,
      longitude: address.longitude,
      label: address.label,
      save_address: true,
      is_default: address.is_default
    });
    this.rememberRecentAddress(address.id);
    void this.syncAvailability(address.latitude, address.longitude);
  }

  availabilityHeadline() {
    if (this.location.permission() === 'loading') {
      return 'Checking your current location';
    }
    if (this.location.permission() === 'denied' || this.location.permission() === 'unsupported') {
      return 'Location access is required to use this service.';
    }
    if (!this.location.availability()?.available) {
      return 'Service not available at your location';
    }
    return 'Address looks good for delivery';
  }

  availabilityMessage() {
    if (this.location.availability()?.available) {
      return `Delivery fee Rs ${this.deliveryFee().toFixed(0)} and ETA around ${this.etaMinutes()} minutes.`;
    }
    return this.location.message() || 'Please choose a complete address inside the service radius.';
  }

  selectedAddressSummary() {
    const value = this.form.getRawValue();
    if (!value.door_flat_no || !value.street_name || !value.city || !value.pincode) {
      return '';
    }
    return [value.door_flat_no, value.street_name, value.landmark, value.city, value.pincode].filter(Boolean).join(', ');
  }

  payableTotal() {
    return this.cart.total() + this.deliveryFee();
  }

  isDeliveryBlocked() {
    return this.location.orderingBlocked();
  }

  placeOrderDisabled() {
    return this.loading() || this.isDeliveryBlocked() || this.form.invalid || !this.selectedAddressSummary();
  }

  async placeCodOrder() {
    if (this.placeOrderDisabled()) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const addressId = await this.persistAddressIfNeeded();
      await firstValueFrom(this.api.placeOrder({
        delivery_address: this.selectedAddressSummary(),
        address_id: addressId,
        latitude: this.form.controls.latitude.value,
        longitude: this.form.controls.longitude.value,
        payment_method: 'COD',
        items: this.cart.toApiPayload()
      }));
      this.cart.clear();
      await this.router.navigateByUrl('/order-success');
    } catch (error: any) {
      this.error.set(error?.error?.detail ?? 'Unable to place order.');
    } finally {
      this.loading.set(false);
    }
  }

  async startOnlinePayment() {
    if (this.placeOrderDisabled()) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const addressId = await this.persistAddressIfNeeded();
      const response = await firstValueFrom(this.api.createPaymentOrder({
        delivery_address: this.selectedAddressSummary(),
        address_id: addressId,
        latitude: this.form.controls.latitude.value,
        longitude: this.form.controls.longitude.value,
        items: this.cart.toApiPayload()
      }));
      this.loading.set(false);
      await this.ensureRazorpayScript();
      const RazorpayCtor = window.Razorpay;
      if (!RazorpayCtor) {
        this.error.set('Unable to load payment gateway right now.');
        return;
      }
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
            delivery_address: this.selectedAddressSummary(),
            address_id: addressId,
            latitude: this.form.controls.latitude.value,
            longitude: this.form.controls.longitude.value,
            razorpay_order_id: payment['razorpay_order_id'],
            razorpay_payment_id: payment['razorpay_payment_id'],
            razorpay_signature: payment['razorpay_signature'],
            items: this.cart.toApiPayload()
          }).subscribe(() => {
            this.cart.clear();
            void this.router.navigateByUrl('/order-success');
          });
        },
        modal: {
          ondismiss: () => this.error.set('Payment was not completed. Please try again.')
        }
      };
      const razorpay = new RazorpayCtor(options);
      razorpay.on('payment.failed', () => this.error.set('Payment was not completed. Please try again.'));
      razorpay.open();
    } catch (error: any) {
      this.loading.set(false);
      this.error.set(error?.error?.detail ?? 'Unable to start payment.');
    }
  }

  private async persistAddressIfNeeded(): Promise<number | null> {
    const payload = {
      label: this.form.controls.label.value,
      formatted_address: this.form.controls.formatted_address.value,
      door_flat_no: this.form.controls.door_flat_no.value,
      street_name: this.form.controls.street_name.value,
      landmark: this.form.controls.landmark.value || null,
      city: this.form.controls.city.value,
      pincode: this.form.controls.pincode.value,
      latitude: this.form.controls.latitude.value,
      longitude: this.form.controls.longitude.value,
      is_default: this.form.controls.is_default.value
    };

    if (!this.form.controls.save_address.value) {
      return this.selectedAddress()?.id ?? null;
    }

    let saved: AddressRecord;
    if (this.selectedAddress()?.id) {
      saved = await firstValueFrom(this.api.updateAddress(this.selectedAddress()!.id, payload));
    } else {
      saved = await firstValueFrom(this.api.createAddress(payload));
    }
    this.selectedAddress.set(saved);
    this.editingAddress.set(false);
    await this.reloadAddresses(saved.id);
    return saved.id;
  }

  private async fetchSuggestions(query: string) {
    this.suggestions.set(await this.maps.searchPlaces(query));
  }

  private async applyPlaceResult(details: PlaceLocationResult) {
    this.suggestions.set([]);
    this.selectedAddress.set(null);
    this.editingAddress.set(true);
    this.form.patchValue({
      formatted_address: details.formattedAddress,
      street_name: details.streetName || this.form.controls.street_name.value,
      city: details.city || this.form.controls.city.value,
      pincode: details.pincode || this.form.controls.pincode.value,
      latitude: details.latitude,
      longitude: details.longitude
    });
    await this.syncAvailability(details.latitude, details.longitude);
  }

  private async syncAvailability(latitude: number, longitude: number) {
    await this.location.setManualLocation({ latitude, longitude });
    this.deliveryFee.set(this.location.availability()?.delivery_fee ?? 0);
    this.etaMinutes.set(this.location.availability()?.estimated_delivery_time_minutes ?? 25);
  }

  private async reloadAddresses(selectedId?: number) {
    const addresses = await firstValueFrom(this.api.myAddresses());
    this.savedAddresses.set(addresses);
    this.refreshRecentAddresses();
    if (selectedId) {
      const selected = addresses.find((address) => address.id === selectedId);
      if (selected) {
        this.selectSavedAddress(selected);
      }
    }
  }

  private rememberRecentAddress(addressId: number) {
    const current = JSON.parse(localStorage.getItem(RECENT_ADDRESS_KEY) ?? '[]') as number[];
    const updated = [addressId, ...current.filter((id) => id !== addressId)].slice(0, 4);
    localStorage.setItem(RECENT_ADDRESS_KEY, JSON.stringify(updated));
    this.refreshRecentAddresses();
  }

  private refreshRecentAddresses() {
    const recentIds = JSON.parse(localStorage.getItem(RECENT_ADDRESS_KEY) ?? '[]') as number[];
    const rows = recentIds
      .map((id) => this.savedAddresses().find((address) => address.id === id))
      .filter((address): address is AddressRecord => !!address);
    this.recentAddresses.set(rows);
  }

  private async initializeMap() {
    const google = await this.maps.load();
    if (!google || !this.mapCanvas) {
      return;
    }
    const center = this.location.coordinates() ?? {
      latitude: this.form.controls.latitude.value || FALLBACK_LATITUDE,
      longitude: this.form.controls.longitude.value || FALLBACK_LONGITUDE
    };
    const map = new google.maps.Map(this.mapCanvas.nativeElement, {
      center: { lat: center.latitude, lng: center.longitude },
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true
    });
    const marker = new google.maps.Marker({
      map,
      position: { lat: center.latitude, lng: center.longitude }
    });
    map.addListener('click', async (event: any) => {
      const latitude = event.latLng.lat();
      const longitude = event.latLng.lng();
      marker.setPosition({ lat: latitude, lng: longitude });
      const details = await this.maps.reverseGeocode(latitude, longitude);
      if (details) {
        await this.applyPlaceResult(details);
      } else {
        this.form.patchValue({ latitude, longitude });
        await this.syncAvailability(latitude, longitude);
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
