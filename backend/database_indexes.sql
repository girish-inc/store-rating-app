-- Database indexes for performance optimization
-- Run these SQL statements in your NeonDB console to improve query performance

-- Indexes for stores table
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);
CREATE INDEX IF NOT EXISTS idx_stores_email ON stores(email);
CREATE INDEX IF NOT EXISTS idx_stores_address ON stores(address);
CREATE INDEX IF NOT EXISTS idx_stores_rating ON stores(rating);
CREATE INDEX IF NOT EXISTS idx_stores_created_at ON stores(created_at);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Indexes for ratings table (for joins and filtering)
CREATE INDEX IF NOT EXISTS idx_ratings_store_id ON ratings(store_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ratings_store_user ON ratings(store_id, user_id);
CREATE INDEX IF NOT EXISTS idx_users_role_created ON users(role, created_at);

-- Performance note: These indexes will speed up:
-- 1. Store searches by name and address (LIKE queries)
-- 2. User filtering by name, email, and role
-- 3. Sorting by rating, name, and created_at
-- 4. JOIN operations between stores, users, and ratings tables
-- 5. Admin dashboard queries for counts and recent activity