-- ============================================================================
-- Add a "Bebidas" category with non-alcoholic drinks alongside the existing
-- menu (does not touch Torresmos/Petiscos/Burgers/Sanduíches/Doces).
-- ============================================================================

DO $$
DECLARE
  c_bebidas UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.categories (id, name, sort_order) VALUES
    (c_bebidas, 'Bebidas', 7);

  INSERT INTO public.products (category_id, name, description, price, sort_order) VALUES
    (c_bebidas, 'Coca-Cola Zero', '350ml', 8.55, 1),
    (c_bebidas, 'Coca-Cola Original', '350ml', 8.55, 2),
    (c_bebidas, 'Fanta Laranja', 'Lata 350ml', 8.55, 3),
    (c_bebidas, 'Schweppes Tônica', 'Lata 350ml', 8.55, 4),
    (c_bebidas, 'Água Mineral sem Gás', '500ml', 4.75, 5),
    (c_bebidas, 'Néctar de Maracujá Del Valle', 'Lata 290ml', 8.55, 6);
END $$;
