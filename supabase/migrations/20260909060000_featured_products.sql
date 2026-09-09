-- Lets admins pick which products show in the homepage "Cardápio em
-- Destaque" section instead of it always being whichever 6 active
-- products happen to sort first.
ALTER TABLE public.products ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;
