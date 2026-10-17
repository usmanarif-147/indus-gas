-- Initial administrator account. The stored value is a bcrypt password hash.
INSERT INTO users (username, password)
VALUES ('usman', '$2b$12$aUxWslgqXs1lu4cH0635oOHcPOvBqO6ritopktO6OQDp4XF3zI9lO')
ON CONFLICT (username) DO NOTHING;
