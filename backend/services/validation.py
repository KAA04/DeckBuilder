COLORS = {"RED", "PURPLE", "BLUE", "GREEN", "YELLOW"}
TYPES = {"LEADER", "CREATURE", "HABITAT", "TRINKET", "SPELL_MAIN", "SPELL_INTERUPT"}
SORTS = {"name", "type", "set_name", "number"}


def validate_card_row(row: dict, row_number: int) -> list[str]:
    errors = []
    required = ("name", "type", "set_name", "number")
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
    for field in ("number", "health", "power", "defense", "cost"):
        value = str(row.get(field, "")).strip()
        if value:
            try:
                if int(value) < 0:
                    errors.append(f"{field} must not be negative")
            except ValueError:
                errors.append(f"{field} must be an integer")

    health = str(row.get("health", "")).strip()
    if card_type == "LEADER" and not health:
        errors.append("LEADER cards require health")
    elif card_type and card_type != "LEADER" and health:
        errors.append(f"{card_type} cards must not have health")

    power = str(row.get("power", "")).strip()
    if card_type == "CREATURE" and not power:
        errors.append("CREATURE cards require power")
    elif card_type and card_type != "CREATURE" and power:
        errors.append(f"{card_type} cards must not have power")
    defense = str(row.get("defense", "")).strip()
    no_defense_types = {"TRINKET", "SPELL_MAIN", "SPELL_INTERUPT"}
    if card_type in no_defense_types and defense:
        errors.append(f"{card_type} cards must not have defense")
    elif card_type and card_type not in no_defense_types and not defense:
        errors.append(f"{card_type} cards require defense")
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
        "number": int(str(row["number"]).strip()),
        "cost": optional_int(row.get("cost")),
        "image_url": str(row.get("image_url", "")).strip() or None,
    }
