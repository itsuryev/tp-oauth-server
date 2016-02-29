CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NULL,
    client_key TEXT UNIQUE NOT NULL,
    client_secret TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    deleteDate TIMESTAMP WITH TIME ZONE NULL
);

CREATE TABLE access_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    account_name TEXT NOT NULL
);
