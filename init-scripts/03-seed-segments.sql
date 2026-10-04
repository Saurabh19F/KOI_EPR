-- Segment Master Seed Data
-- Table: segments

INSERT INTO segments (segment_id, company_id, segment_code, segment_name, description, is_active) VALUES
(gen_random_uuid(), NULL, '00', 'Common Use Products', 'Common use products available for all', true),
(gen_random_uuid(), NULL, '01', 'Kids Segment', 'Products for kids category', true),
(gen_random_uuid(), NULL, '02', 'Adult Segment', 'Products for adult category', true);

-- Segment Codes Summary:
-- | Code | Segment Name |
-- |------|------------|
-- | 00   | Common Use Products |
-- | 01   | Kids Segment |
-- | 02   | Adult Segment |
