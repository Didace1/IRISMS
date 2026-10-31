-- Remove hardcoded categories that were seeded in previous versions
-- This migration cleans up the categories table from hardcoded data

DELETE FROM categories WHERE name IN ('Batteries', 'Storage', 'Screens', 'Memory', 'Accessories', 'Cooling');

-- Note: This will only delete the hardcoded categories, leaving any user-created categories intact