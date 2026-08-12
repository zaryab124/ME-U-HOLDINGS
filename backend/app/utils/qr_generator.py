import hmac
import hashlib
import qrcode
import io
import base64
from app.core.config import settings

def generate_qr_token(branch_id: str, table_number: str) -> str:
    """
    Generates a cryptographically signed QR code token bound to branch_id and table_number.
    Prevent client-side tampering of branch_id or table_id.
    """
    raw_payload = f"{branch_id}:{table_number}"
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        raw_payload.encode(),
        hashlib.sha256
    ).hexdigest()[:16]
    return f"TBL-{branch_id[:8]}-{table_number}-{signature}"

def generate_qr_code_image_base64(qr_token: str, app_url: str = "http://localhost:3000") -> str:
    target_url = f"{app_url}/dine-in?qr={qr_token}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(target_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"
