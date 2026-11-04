from flask import Blueprint, g, jsonify, request

from services.supabase import owned_deck, require_auth

decks_bp = Blueprint("decks", __name__, url_prefix="/api/decks")
MAX_DECK_SIZE = 70


def deck_with_cards(deck_id: str):
    result = (
        g.supabase.table("decks")
        .select(
            "id, user_id, name, description, updated_at, "
            "deck_cards(card_id, quantity, cards(id, name, text, color1, color2, type, health, power, defense, cost, set_name, number, image_url))"
        )
        .eq("id", deck_id)
        .eq("user_id", g.user.id)
        .maybe_single()
        .execute()
    )
    deck = result.data
    if deck:
        deck["cards"] = deck.pop("deck_cards", [])
        deck["card_count"] = sum(item.get("quantity", 0) for item in deck["cards"])
    return deck


@decks_bp.get("")
@require_auth
def list_decks():
    result = (
        g.supabase.table("decks")
        .select("id, user_id, name, description, updated_at, deck_cards(quantity)")
        .eq("user_id", g.user.id)
        .order("updated_at", desc=True)
        .execute()
    )
    decks = []
    for deck in result.data or []:
        quantities = deck.pop("deck_cards", [])
        deck["card_count"] = sum(item.get("quantity", 0) for item in quantities)
        decks.append(deck)
    return jsonify(decks)


@decks_bp.post("")
@require_auth
def create_deck():
    body = request.get_json(silent=True) or {}
    name = str(body.get("name", "")).strip()
    if not name or len(name) > 80:
        return jsonify({"error": "A deck name between 1 and 80 characters is required."}), 400
    result = (
        g.supabase.table("decks")
        .insert({
            "user_id": g.user.id,
            "name": name,
            "description": str(body.get("description", "")).strip() or None,
        })
        .execute()
    )
    return jsonify(result.data[0]), 201


@decks_bp.get("/<deck_id>")
@require_auth
def get_deck(deck_id):
    deck = deck_with_cards(deck_id)
    if not deck:
        return jsonify({"error": "Deck not found."}), 404
    return jsonify(deck)


@decks_bp.patch("/<deck_id>")
@require_auth
def update_deck(deck_id):
    if not owned_deck(deck_id):
        return jsonify({"error": "Deck not found."}), 404
    body = request.get_json(silent=True) or {}
    updates = {}
    if "name" in body:
        name = str(body["name"]).strip()
        if not name or len(name) > 80:
            return jsonify({"error": "A deck name between 1 and 80 characters is required."}), 400
        updates["name"] = name
    if "description" in body:
        updates["description"] = str(body["description"]).strip() or None
    if not updates:
        return jsonify({"error": "At least one editable field is required."}), 400
    result = (
        g.supabase.table("decks")
        .update(updates)
        .eq("id", deck_id)
        .eq("user_id", g.user.id)
        .execute()
    )
    return jsonify(result.data[0])


@decks_bp.delete("/<deck_id>")
@require_auth
def delete_deck(deck_id):
    if not owned_deck(deck_id):
        return jsonify({"error": "Deck not found."}), 404
    g.supabase.table("decks").delete().eq("id", deck_id).eq("user_id", g.user.id).execute()
    return "", 204


@decks_bp.post("/<deck_id>/cards")
@require_auth
def add_card(deck_id):
    if not owned_deck(deck_id):
        return jsonify({"error": "Deck not found."}), 404
    body = request.get_json(silent=True) or {}
    try:
        card_id = int(body.get("card_id"))
        quantity = int(body.get("quantity", 1))
    except (TypeError, ValueError):
        return jsonify({"error": "card_id and quantity must be integers."}), 400
    if quantity < 1:
        return jsonify({"error": "Quantity must be at least 1."}), 400
    card = (
        g.supabase.table("cards")
        .select("id")
        .eq("id", card_id)
        .limit(1)
        .execute()
    )
    if not card.data:
        return jsonify({"error": "Card not found."}), 404
    existing = (
        g.supabase.table("deck_cards")
        .select("quantity")
        .eq("deck_id", deck_id)
        .eq("card_id", card_id)
        .limit(1)
        .execute()
    )
    existing_quantity = existing.data[0]["quantity"] if existing.data else 0
    new_quantity = quantity + existing_quantity
    current_total = sum(
        item["quantity"]
        for item in (
            g.supabase.table("deck_cards")
            .select("quantity")
            .eq("deck_id", deck_id)
            .execute()
            .data
            or []
        )
    )
    if current_total + quantity > MAX_DECK_SIZE:
        return jsonify({"error": f"Decks are limited to {MAX_DECK_SIZE} cards."}), 400
    result = g.supabase.table("deck_cards").upsert(
        {"deck_id": deck_id, "card_id": card_id, "quantity": new_quantity},
        on_conflict="deck_id,card_id",
    ).execute()
    return jsonify(result.data[0]), 201


@decks_bp.patch("/<deck_id>/cards/<int:card_id>")
@require_auth
def update_card_quantity(deck_id, card_id):
    if not owned_deck(deck_id):
        return jsonify({"error": "Deck not found."}), 404
    body = request.get_json(silent=True) or {}
    try:
        quantity = int(body.get("quantity"))
    except (TypeError, ValueError):
        return jsonify({"error": "quantity must be an integer."}), 400
    if quantity < 0:
        return jsonify({"error": "Quantity cannot be negative."}), 400
    current_cards = (
        g.supabase.table("deck_cards")
        .select("card_id, quantity")
        .eq("deck_id", deck_id)
        .execute()
        .data
        or []
    )
    current_total = sum(item["quantity"] for item in current_cards if item["card_id"] != card_id)
    if current_total + quantity > MAX_DECK_SIZE:
        return jsonify({"error": f"Decks are limited to {MAX_DECK_SIZE} cards."}), 400
    query = g.supabase.table("deck_cards").delete() if quantity == 0 else g.supabase.table("deck_cards").update({"quantity": quantity})
    result = query.eq("deck_id", deck_id).eq("card_id", card_id).execute()
    return jsonify({"quantity": 0 if quantity == 0 else result.data[0]["quantity"]})


@decks_bp.delete("/<deck_id>/cards/<int:card_id>")
@require_auth
def remove_card(deck_id, card_id):
    if not owned_deck(deck_id):
        return jsonify({"error": "Deck not found."}), 404
    g.supabase.table("deck_cards").delete().eq("deck_id", deck_id).eq("card_id", card_id).execute()
    return "", 204
