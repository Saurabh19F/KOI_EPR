-- Product Categories Seed Data
-- IMPORTANT: Category Code and Category Name are SEPARATE fields
-- Same code can be used for multiple category names

INSERT INTO product_categories (id, company_id, category_code, category_name, description, is_active) VALUES
-- BR - Branded
(gen_random_uuid(), NULL, 'BR', 'Branded', 'Branded products', true),

-- PVT - Pvt Label (Multiple meanings)
(gen_random_uuid(), NULL, 'PVT', 'Pvt Label', 'Private label products', true),
(gen_random_uuid(), NULL, 'PVT', 'Pvt Packing', 'Private packing products', true),

-- KRI - Multiple categories with same code
(gen_random_uuid(), NULL, 'KRI', 'LOF', 'LOF brand products', true),
(gen_random_uuid(), NULL, 'KRI', 'Crispeez', 'Crispeez brand products', true),
(gen_random_uuid(), NULL, 'KRI', 'Krishna', 'Krishna brand products', true),

-- Other categories
(gen_random_uuid(), NULL, 'MIS', 'Miscellaneous', 'Miscellaneous products', true),
(gen_random_uuid(), NULL, 'UTE', 'Utensils', 'Utensil products', true),
(gen_random_uuid(), NULL, 'SPO', 'Sports', 'Sports products', true),
(gen_random_uuid(), NULL, 'OTH', 'Other', 'Other uncategorized products', true);

-- Product Categories Summary Table:
-- | Category Code | Category Name  | Note |
-- |--------------|---------------|------|
-- | BR           | Branded       | 1 name |
-- | PVT          | Pvt Label     | 1 name |
-- | PVT          | Pvt Packing   | 2nd name with same code |
-- | KRI          | LOF           | 3 names with same code |
-- | KRI          | Crispeez      | |
-- | KRI          | Krishna       | |
-- | MIS          | Miscellaneous | 1 name |
-- | UTE          | Utensils      | 1 name |
-- | SPO          | Sports        | 1 name |
-- | OTH          | Other         | 1 name |
