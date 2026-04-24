UPDATE users SET level = 'admin' WHERE username = 'admin';
UPDATE users SET status = 'active' WHERE username = 'admin';
SELECT * FROM users WHERE username = 'admin';
