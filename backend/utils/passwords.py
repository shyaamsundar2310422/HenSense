# utils/passwords.py

def truncate_password_for_bcrypt(pw: str, max_bytes: int = 72) -> str:
    """
    Ensure password fits bcrypt's 72-byte limit.
    Safely truncates UTF-8 to <= 72 bytes (bcrypt hard limit).
    """
    if pw is None:
        return ""

    encoded = pw.encode("utf-8")

    if len(encoded) <= max_bytes:
        return pw

    truncated = encoded[:max_bytes]
    return truncated.decode("utf-8", errors="ignore")
