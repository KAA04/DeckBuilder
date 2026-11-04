import csv
import io

from flask import Blueprint, g, jsonify, request
from postgrest.exceptions import APIError

from services.supabase import require_admin
from services.validation import normalize_card_row, validate_card_row

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")
REQUIRED_COLUMNS = {"name", "type", "set_name", "number"}


@admin_bp.post("/cards/import")
@require_admin
def import_cards():
    uploaded = request.files.get("file")
    if not uploaded or not uploaded.filename.lower().endswith(".csv"):
        return jsonify({"error": "Upload a CSV file."}), 400
    try:
        rows = list(csv.DictReader(io.TextIOWrapper(uploaded.stream, encoding="utf-8-sig")))
    except (UnicodeDecodeError, csv.Error):
        return jsonify({"error": "The CSV could not be decoded."}), 400
    if not rows:
        return jsonify({"error": "The CSV contains no data rows."}), 400
    missing = REQUIRED_COLUMNS - set(rows[0].keys())
    if missing:
        return jsonify({"error": f"Missing required columns: {', '.join(sorted(missing))}"}), 400

    errors = []
    valid_rows = []
    seen_keys = set()
    for row_number, row in enumerate(rows, start=2):
        row_errors = validate_card_row(row, row_number)
        key = (str(row.get("set_name", "")).strip().lower(), str(row.get("number", "")).strip())
        if key in seen_keys:
            row_errors.append("duplicate set_name + number in this file")
        seen_keys.add(key)
        if row_errors:
            errors.append({"row": row_number, "errors": row_errors})
        else:
            valid_rows.append(normalize_card_row(row))

    if errors:
        return jsonify({"error": "Fix the validation errors before importing.", "errors": errors}), 422
    existing = g.supabase.table("cards").select("set_name, number").execute().data or []
    existing_keys = {(item["set_name"].lower(), str(item["number"])) for item in existing}
    duplicates = [
        {"row": index + 2, "errors": ["set_name + number already exists"]}
        for index, row in enumerate(valid_rows)
        if (row["set_name"].lower(), str(row["number"])) in existing_keys
    ]
    if duplicates:
        return jsonify({"error": "Some cards already exist.", "errors": duplicates}), 409
    try:
        result = g.supabase.table("cards").insert(valid_rows).execute()
    except APIError as error:
        message = getattr(error, "message", None) or str(error)
        return jsonify({"error": f"Supabase rejected the cards: {message}"}), 422
    return jsonify({"imported": len(result.data or [])}), 201


@admin_bp.post("/cards/import-one")
@require_admin
def import_one_card():
    row = request.get_json(silent=True) or {}
    errors = validate_card_row(row, 1)
    if errors:
        return jsonify({"error": "Fix the validation errors before importing.", "errors": [{"row": 1, "errors": errors}]}), 422

    card = normalize_card_row(row)
    existing = (
        g.supabase.table("cards")
        .select("id")
        .eq("set_name", card["set_name"])
        .eq("number", card["number"])
        .limit(1)
        .execute()
    )
    if existing.data:
        return jsonify({"error": "A card with this set name and number already exists."}), 409

    try:
        result = g.supabase.table("cards").insert(card).execute()
    except APIError as error:
        message = getattr(error, "message", None) or str(error)
        return jsonify({"error": f"Supabase rejected the card: {message}"}), 422
    return jsonify({"imported": len(result.data or [])}), 201
