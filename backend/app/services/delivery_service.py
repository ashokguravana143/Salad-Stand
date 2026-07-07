from math import asin, cos, radians, sin, sqrt

from app.core.config import settings


class DeliveryService:
    EARTH_RADIUS_KM = 6371.0

    def haversine_distance_km(self, latitude: float, longitude: float) -> float:
        latitude_1 = radians(settings.service_latitude)
        longitude_1 = radians(settings.service_longitude)
        latitude_2 = radians(latitude)
        longitude_2 = radians(longitude)

        delta_latitude = latitude_2 - latitude_1
        delta_longitude = longitude_2 - longitude_1

        arc = (
            sin(delta_latitude / 2) ** 2
            + cos(latitude_1) * cos(latitude_2) * sin(delta_longitude / 2) ** 2
        )
        return 2 * self.EARTH_RADIUS_KM * asin(sqrt(arc))

    def check_availability(self, latitude: float, longitude: float) -> dict:
        distance_km = round(self.haversine_distance_km(latitude, longitude), 2)
        available = distance_km <= settings.service_radius_km
        distance_charge_km = max(distance_km - 1, 0)
        delivery_fee = round(settings.base_delivery_fee + (distance_charge_km * settings.delivery_fee_per_km), 2)
        estimated_delivery_time_minutes = int(round(settings.base_delivery_eta_minutes + distance_km * settings.extra_eta_per_km_minutes))
        message = "Service available at your location" if available else "Service not available at your location"
        return {
            "available": available,
            "distance_km": distance_km,
            "radius_km": round(settings.service_radius_km, 2),
            "delivery_fee": delivery_fee,
            "estimated_delivery_time_minutes": estimated_delivery_time_minutes,
            "message": message,
        }
