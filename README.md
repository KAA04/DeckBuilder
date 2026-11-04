# Cardforge Deck Builder

A full-stack, Archidekt-style trading-card deck builder using React/Vite/TypeScript, Flask, and Supabase. It works with the existing Supabase schema described in the project brief and does not create or alter tables.

## Setup

1. Copy `frontend/.env.example` to `frontend/.env` and set the public Supabase URL and anon key.
2. Copy `backend/.env.example` to `backend/.env` with the Supabase URL, anon key, and server-only service role key.
3. Activate the existing virtual environment: `..\.venv\Scripts\Activate.ps1` from `backend`, or `\.venv\Scripts\Activate.ps1` from the repository root.
4. Install backend dependencies: `pip install -r backend/requirements.txt`.
5. Install frontend dependencies: `npm install --prefix frontend`.

## Run locally

In one terminal: `python backend/app.py`

In another terminal: `npm run dev --prefix frontend`

Open <http://localhost:5173>.

## Supabase notes

Users register and sign in with only a username and password. Registration is handled by the backend using Supabase's server-only admin API, with the synthetic internal address confirmed immediately so no email is sent. The username is normalized before checking uniqueness, and passwords must meet the configured minimum requirement. The registration page sends the normalized username as user metadata so the existing profile trigger can create the profile. Keep the Supabase service role key out of the frontend and never expose it to Vite. Existing Row Level Security policies should allow authenticated users to read cards and manage only their own decks; admin card writes should be restricted to `profiles.role = 'ADMIN'`. Ensure `profiles.username` has a unique constraint so duplicate usernames cannot be created.

To create the first admin, register a user, then set that user's `profiles.role` to `ADMIN` in the Supabase dashboard or an approved server-side SQL workflow. The Import Cards page will then appear for that account.

## CSV import

Required columns: `name,type,set_name,numer`. Optional columns: `text,color1,color2,health,power,defense,image_url`. Enum values must match the schema, including the existing spelling `SPELL_INTERUPT`.
