-- Initial administrator account. The stored value is a bcrypt password hash.
INSERT INTO users (username, password)
VALUES ('usman', '$2b$12$mXIbfy1CmVrPANQTMQ/57.5TTFM6DHwDE9AsEc2ukzE2ibRq.SqBW')
ON CONFLICT (username) DO NOTHING;
