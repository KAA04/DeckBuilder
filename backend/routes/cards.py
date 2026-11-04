from flask import Blueprint, g, jsonify, request

from services.supabase import require_auth
from services.validation import COLORS, SORTS, TYPES

cards_bp = Blueprint("cards", __name__, url_prefix="/api/cards")


@cards_bp.get("")
@require_auth
def search_cards():
    search = request.args.get("search", "").strip()
    card_type = request.args.get("type", "").upper().strip()
    color = request.args.get("color", "").upper().strip()
    set_name = request.args.get("set_name", "").strip()
    sort = request.args.get("sort", "name")
    try:
        page = max(1, int(request.args.get("page", "1")))
        limit = min(60, max(1, int(request.args.get("limit", "24"))))
    except ValueError:
        return jsonify({"error": "page and limit must be integers."}), 400
    if card_type and card_type not in TYPES:
        return jsonify({"error": "Invalid card type."}), 400
    if color and color not in COLORS:
        return jsonify({"error": "Invalid card color."}), 400
    if sort not in SORTS:
        return jsonify({"error": "Invalid sort field."}), 400

    query = g.supabase.table("cards").select(
        "id, name, text, color1, color2, type, health, power, defense, cost, set_name, number, image_url"
    )
    if search:
        query = query.ilike("name", f"%{search}%")
    if card_type:
        query = query.eq("type", card_type)
    if color:
        query = query.or_(f"color1.eq.{color},color2.eq.{color}")
    if set_name:
        query = query.ilike("set_name", f"%{set_name}%")
    start = (page - 1) * limit
    result = query.order(sort).range(start, start + limit).execute()
    cards = result.data or []
    return jsonify({
        "cards": cards[:limit],
        "page": page,
        "limit": limit,
        "total": None,
        "has_more": len(cards) > limit,
    })
