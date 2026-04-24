ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active' AFTER level;
UPDATE users SET status = 'active' WHERE status IS NULL;
