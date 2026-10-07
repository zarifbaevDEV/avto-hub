import re
import random
import string


def normalize_phone(phone: str) -> str:
    """
    Normalizes phone numbers to standard international format (e.g., +998901234567)
    """
    digits = re.sub(r'\D', '', phone)
    if digits.startswith('998') and len(digits) == 12:
        return f"+{digits}"
    elif len(digits) == 9:
        return f"+998{digits}"
    return f"+{digits}"


def generate_otp_code(length: int = 6) -> str:
    """
    Generates a secure numeric OTP code.
    """
    return ''.join(random.choices(string.digits, k=length))


def validate_vin(vin: str) -> bool:
    """
    Basic VIN (Vehicle Identification Number) format check:
    17 characters, alphanumeric, excluding I, O, Q.
    """
    if not vin:
        return False
    vin_upper = vin.upper().strip()
    if len(vin_upper) != 17:
        return False
    # Characters I, O, Q are not allowed in standard VIN
    return bool(re.match(r'^[A-HJ-NPR-Z0-9]{17}$', vin_upper))
