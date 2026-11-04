from functools import wraps

from flask import g, jsonify, request
from supabase import Client, create_client

from config import settings


def get_supabase(access_token: str | None = None) -> Client:
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    if access_token:
        client.postgrest.auth(access_token)
    return client


def get_supabase_admin() -> Client:
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required for registration.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def require_auth(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "A valid Bearer token is required."}), 401
        token = header.removeprefix("Bearer ").strip()
        if not token:
            return jsonify({"error": "A valid access token is required."}), 401
        try:
            auth_response = get_supabase().auth.get_user(token)
            user = auth_response.user
            if not user:
                raise ValueError("No user returned")
        except Exception:
            return jsonify({"error": "The access token is invalid or expired."}), 401
        g.user = user
        g.access_token = token
        g.supabase = get_supabase(token)
        return handler(*args, **kwargs)

    return wrapped


def require_admin(handler):
    @wraps(handler)
    @require_auth
    def wrapped(*args, **kwargs):
        profile = (
            g.supabase.table("profiles")
            .select("role")
            .eq("id", g.user.id)
            .maybe_single()
            .execute()
        )
        if not profile.data or profile.data.get("role") != "ADMIN":
            return jsonify({"error": "Administrator access is required."}), 403
        return handler(*args, **kwargs)

    return wrapped


def owned_deck(deck_id: str):
    result = (
        g.supabase.table("decks")
        .select("*")
        .eq("id", deck_id)
        .eq("user_id", g.user.id)
        .maybe_single()
        .execute()
    )
    return result.data
