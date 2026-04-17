import hashlib
import hmac
import uuid
from decimal import Decimal

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


class PaymentService:
    @staticmethod
    def is_configured() -> bool:
        return bool(settings.razorpay_key_id.strip() and settings.razorpay_key_secret.strip())

    @staticmethod
    def get_key_id() -> str:
        return settings.razorpay_key_id

    async def create_order(self, amount: Decimal) -> dict:
        if not self.is_configured():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Online payments are not configured yet.")
        payload = {
            "amount": int(amount * Decimal("100")),
            "currency": "INR",
            "receipt": f"ss_{uuid.uuid4().hex[:20]}",
        }
        async with httpx.AsyncClient(auth=(settings.razorpay_key_id, settings.razorpay_key_secret), timeout=15) as client:
            response = await client.post("https://api.razorpay.com/v1/orders", json=payload)
        if response.status_code >= 400:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to start online payment.")
        return response.json()

    def verify_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        if not self.is_configured():
            return False
        message = f"{order_id}|{payment_id}".encode()
        digest = hmac.new(settings.razorpay_key_secret.encode(), message, hashlib.sha256).hexdigest()
        return hmac.compare_digest(digest, signature)
