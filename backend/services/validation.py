COLORS = {"RED", "PURPLE", "BLUE", "GREEN", "YELLOW"}
TYPES = {"LEADER", "CREATURE", "HABITAT", "TRINKET", "SPELL_MAIN", "SPELL_INTERUPT"}
SORTS = {"name", "type", "set_name", "numer"}


def validate_card_row(row: dict, row_number: int) -> list[str]:
    errors = []
    required = ("name", "type", "set_name", "numer")
    for field in required:
        if not str(row.get(field, "")).strip():
            errors.append(f"{field} is required")
    card_type = str(row.get("type", "")).strip().upper()
    if card_type and card_type not in TYPES:
        errors.append(f"type must be one of: {', '.join(sorted(TYPES))}")
    for field in ("color1", "color2"):
        value = str(row.get(field, "")).strip().upper()
        if value and value not in COLORS:
            errors.append(f"{field} must be one of: {', '.join(sorted(COLORS))}")
    for field in ("numer", "health", "power", "defense"):
        value = str(row.get(field, "")).strip()
        if value:
            try:
                int(value)
            except ValueError:
                errors.append(f"{field} must be an integer")
    if card_type == "LEADER" and not str(row.get("health", "")).strip():
        errors.append("LEADER cards require health")
    if card_type == "CREATURE" and not str(row.get("power", "")).strip():
        errors.append("CREATURE cards require power")
    if card_type in {"SPELL_MAIN", "SPELL_INTERUPT"} and str(row.get("defense", "")).strip():
        errors.append(f"{card_type} cards must not have defense")
    return errors


def normalize_card_row(row: dict) -> dict:
    def optional_int(value):
        value = str(value or "").strip()
        return int(value) if value else None

    def optional_enum(value):
        value = str(value or "").strip().upper()
        return value or None

    return {
        "name": str(row["name"]).strip(),
        "text": str(row.get("text", "")).strip() or None,
        "color1": optional_enum(row.get("color1")),
        "color2": optional_enum(row.get("color2")),
        "type": str(row["type"]).strip().upper(),
        "health": optional_int(row.get("health")),
        "power": optional_int(row.get("power")),
        "defense": optional_int(row.get("defense")),
        "set_name": str(row["set_name"]).strip(),
        "numer": int(str(row["numer"]).strip()),
        "image_url": str(row.get("image_url", "")).strip() or None,
    }
