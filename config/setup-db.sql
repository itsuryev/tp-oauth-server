DROP TABLE IF EXISTS access_tokens;
DROP TABLE IF EXISTS clients;

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NULL,
    client_key TEXT UNIQUE NOT NULL,
    client_secret TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    deleteDate TIMESTAMP WITH TIME ZONE NULL
);

INSERT INTO
    clients (name, client_key, client_secret, redirect_uri, description)
    VALUES ('Test Application #1', 'testApp1', 'testApp1Secret', 'http://localhost:3001/callback', 'This is the first test application');

CREATE TABLE access_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    account_name TEXT NOT NULL
);
