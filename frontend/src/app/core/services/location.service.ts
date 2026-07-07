import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { LocationPermissionState, ServiceAvailability } from '../models/app.models';
import { AppDataService } from './app-data.service';

const LOCATION_CACHE_KEY = 'saladstand_location_cache';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly permissionState = signal<LocationPermissionState>('idle');
  private readonly coordinatesState = signal<Coordinates | null>(this.readCachedCoordinates());
  private readonly availabilityState = signal<ServiceAvailability | null>(null);
  private readonly messageState = signal('');
  private initialized = false;

  readonly permission = computed(() => this.permissionState());
  readonly coordinates = computed(() => this.coordinatesState());
  readonly availability = computed(() => this.availabilityState());
  readonly message = computed(() => this.messageState());
  readonly loading = computed(() => this.permissionState() === 'loading');
  readonly hasLocation = computed(() => this.permissionState() === 'granted' && !!this.coordinatesState());
  readonly serviceable = computed(() => !!this.availabilityState()?.available);
  readonly orderingBlocked = computed(() => !this.hasLocation() || !this.serviceable());

  constructor(private readonly api: AppDataService) {}

  async ensureInitialized(force = false): Promise<void> {
    if (this.initialized && !force) {
      return;
    }
    this.initialized = true;
    if (this.coordinatesState() && !force) {
      this.permissionState.set('granted');
      await this.refreshAvailability(this.coordinatesState()!);
      return;
    }
    await this.requestCurrentLocation(force);
  }

  async requestCurrentLocation(force = true): Promise<void> {
    if (!navigator.geolocation) {
      this.permissionState.set('unsupported');
      this.availabilityState.set(null);
      this.messageState.set('Location access is required to use this service.');
      return;
    }

    this.permissionState.set('loading');
    this.messageState.set('');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: force ? 0 : 300000
        })
      );
      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      this.coordinatesState.set(coordinates);
      this.permissionState.set('granted');
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(coordinates));
      await this.refreshAvailability(coordinates);
    } catch {
      this.permissionState.set('denied');
      this.coordinatesState.set(null);
      this.availabilityState.set(null);
      this.messageState.set('Location access is required to use this service.');
      localStorage.removeItem(LOCATION_CACHE_KEY);
    }
  }

  async setManualLocation(coordinates: Coordinates): Promise<void> {
    this.coordinatesState.set(coordinates);
    this.permissionState.set('granted');
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(coordinates));
    await this.refreshAvailability(coordinates);
  }

  private async refreshAvailability(coordinates: Coordinates): Promise<void> {
    try {
      const availability = await firstValueFrom(this.api.checkServiceAvailability(coordinates.latitude, coordinates.longitude));
      this.availabilityState.set(availability);
      this.messageState.set(availability.message);
    } catch {
      this.availabilityState.set(null);
      this.messageState.set('Unable to verify service availability right now.');
    }
  }

  private readCachedCoordinates(): Coordinates | null {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Coordinates) : null;
  }
}
