import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google?: any;
  }
}

export interface PlaceSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  description: string;
}

export interface PlaceLocationResult {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  pincode: string;
  streetName: string;
}

@Injectable({ providedIn: 'root' })
export class GoogleMapsService {
  private loadPromise: Promise<any> | null = null;

  async load(): Promise<any | null> {
    if (!environment.googleMapsApiKey) {
      return null;
    }
    if (window.google?.maps?.places) {
      return window.google;
    }
    if (!this.loadPromise) {
      this.loadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google);
        script.onerror = () => reject(new Error('Unable to load Google Maps.'));
        document.body.appendChild(script);
      });
    }
    return this.loadPromise;
  }

  async searchPlaces(query: string): Promise<PlaceSuggestion[]> {
    const google = await this.load();
    if (!google || query.trim().length < 3) {
      return [];
    }
    return new Promise((resolve) => {
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        { input: query, componentRestrictions: { country: 'in' } },
        (predictions: any[] = [], status: string) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK) {
            resolve([]);
            return;
          }
          resolve(
            predictions.map((prediction) => ({
              placeId: prediction.place_id,
              primaryText: prediction.structured_formatting?.main_text ?? prediction.description,
              secondaryText: prediction.structured_formatting?.secondary_text ?? '',
              description: prediction.description
            }))
          );
        }
      );
    });
  }

  async getPlaceDetails(placeId: string): Promise<PlaceLocationResult | null> {
    const google = await this.load();
    if (!google) {
      return null;
    }
    return new Promise((resolve) => {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails(
        {
          placeId,
          fields: ['formatted_address', 'address_components', 'geometry']
        },
        (place: any, status: string) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) {
            resolve(null);
            return;
          }
          resolve(this.toPlaceResult(place));
        }
      );
    });
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<PlaceLocationResult | null> {
    const google = await this.load();
    if (!google) {
      return null;
    }
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results: any[], status: string) => {
        if (status !== 'OK' || !results?.length) {
          resolve(null);
          return;
        }
        resolve(this.toPlaceResult(results[0]));
      });
    });
  }

  private toPlaceResult(place: any): PlaceLocationResult {
    const components = place.address_components ?? [];
    const findComponent = (type: string) =>
      components.find((component: any) => component.types?.includes(type))?.long_name ?? '';

    return {
      formattedAddress: place.formatted_address ?? '',
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      city: findComponent('locality') || findComponent('administrative_area_level_2'),
      pincode: findComponent('postal_code'),
      streetName: [findComponent('route'), findComponent('sublocality_level_1')].filter(Boolean).join(', ')
    };
  }
}
