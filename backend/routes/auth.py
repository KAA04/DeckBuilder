from flask import Blueprint, g, jsonify, request

from services.supabase import get_supabase_admin, require_auth

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
AUTH_EMAIL_DOMAIN = "users.cardforge.local"


@auth_bp.post("/register")
def register():
    body = request.get_json(silent=True) or {}
    username = str(body.get("username", "")).strip().lower()
    password = body.get("password")
    if not isinstance(password, str) or len(password) < 8:
        return jsonify({"error": "Use at least 8 characters for your password."}), 400
    if not username:
        return jsonify({"error": "Username is required."}), 400

    admin = get_supabase_admin()
    existing = (
        admin.table("profiles")
        .select("id")
        .eq("username", username)
        .limit(1)
        .execute()
    )
    if existing.data:
        return jsonify({"error": "That username is already taken."}), 409

    try:
        admin.auth.admin.create_user(
            {
                "email": f"{username}@{AUTH_EMAIL_DOMAIN}",
                "password": password,
                "email_confirm": True,
                "user_metadata": {"username": username},
            }
        )
    except Exception as error:
        message = str(error).lower()
        if "already been registered" in message or "already exists" in message:
            return jsonify({"error": "That username is already taken."}), 409
        return jsonify({"error": "Unable to create the account."}), 400
    return jsonify({"created": True}), 201


@auth_bp.get("/me")
@require_auth
def me():
    profile = (
        g.supabase.table("profiles")
        .select("id, username, role")
        .eq("id", g.user.id)
        .maybe_single()
        .execute()
    )
    return jsonify(
        {
            "user": {"id": g.user.id, "email": g.user.email},
            "profile": profile.data,
        }
    )
