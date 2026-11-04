from flask import Flask, jsonify
from flask_cors import CORS

from config import settings
from routes.admin import admin_bp
from routes.auth import auth_bp
from routes.cards import cards_bp
from routes.decks import decks_bp


def create_app():
    app = Flask(__name__)
    CORS(app, origins=[settings.frontend_url], supports_credentials=True)
    app.register_blueprint(auth_bp)
    app.register_blueprint(decks_bp)
    app.register_blueprint(cards_bp)
    app.register_blueprint(admin_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=settings.port, debug=True)
