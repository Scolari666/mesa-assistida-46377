-- ============================================================================
-- Replace the placeholder seed menu with the real Porks Santa Maria menu.
-- Wipes every category/product/variation/suggestion/combo — orders and
-- order_items are untouched (their product_id/variation_id just go NULL,
-- per the ON DELETE SET NULL added earlier; product_name/unit_price stay
-- snapshotted on the row either way, so order history is unaffected).
-- ============================================================================

DELETE FROM public.product_suggestions;
DELETE FROM public.combo_items;
DELETE FROM public.product_variations;
DELETE FROM public.products;
DELETE FROM public.categories;

DO $$
DECLARE
  c_torresmos UUID := gen_random_uuid();
  c_individuais UUID := gen_random_uuid();
  c_compartilhar UUID := gen_random_uuid();
  c_burgers UUID := gen_random_uuid();
  c_sanduiches UUID := gen_random_uuid();
  c_doces UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.categories (id, name, sort_order) VALUES
    (c_torresmos, 'Torresmos', 1),
    (c_individuais, 'Petiscos Individuais', 2),
    (c_compartilhar, 'Petiscos para Compartilhar', 3),
    (c_burgers, 'Burgers', 4),
    (c_sanduiches, 'Sanduíches', 5),
    (c_doces, 'Doces', 6);

  INSERT INTO public.products (category_id, name, description, price, sort_order) VALUES
    -- Torresmos
    (c_torresmos, 'Porkspóca', 'Pururuca de porco crocante temperada com sal de lemon pepper', 15.00, 1),
    (c_torresmos, 'Torresmo de Tira', 'Finas fatias de torresmo crocante', 29.00, 2),
    (c_torresmos, 'Torresmo Mineiro', 'O tradicional torresmo fritinho e crocante', 29.00, 3),
    (c_torresmos, 'Mix de Torresmos', 'Torresmo mineiro, torresmo de tira e pururuca', 30.00, 4),

    -- Petiscos Individuais
    (c_individuais, 'Costelinha BBQ', 'Suculentas costelinhas de porco ao molho BBQ com cerveja defumada', 35.00, 1),
    (c_individuais, 'Bacon com Melado', 'Tiras de bacon crocante cobertas com melado de cana de açúcar', 27.00, 2),
    (c_individuais, 'Linguicinha Artesanal', 'Linguiça de pernil e especiarias regionais, cortada para petisco e servida com limão à francesa', 27.00, 3),
    (c_individuais, 'Porks Fritas', 'Batata palito ou rústica com páprica picante e maionese temperada', 22.00, 4),

    -- Petiscos para Compartilhar
    (c_compartilhar, 'Pastelzinho de Queijo', 'Porção de pastelzinhos fritos recheados com queijo (8 unidades)', 42.00, 1),
    (c_compartilhar, 'Filé com Fritas', 'Tiras de alcatra bovina no molho de cerveja preta, bacon e batata palito ou rústica', 48.00, 2),
    (c_compartilhar, 'Fucking Fritas', 'Batata palito ou rústica com cheddar e bacon', 38.00, 3),
    (c_compartilhar, 'Filé com Gorgonzola', 'Alcatra em tiras com molho de queijo gorgonzola e batata frita', 52.00, 4),
    (c_compartilhar, 'Batata Tropeira', 'Batata rústica coberta por pernil desfiado e molho barbecue', 45.00, 5),
    (c_compartilhar, 'Hot Wings', 'Meio da asa de frango frito, com tempero levemente picante', 35.00, 6),
    (c_compartilhar, 'Costelinha BBQ com Batata Rústica', 'Suculentas costelinhas de porco ao molho BBQ com cerveja defumada e batatas rústicas', 48.00, 7),
    (c_compartilhar, 'Fish and Chips', 'Iscas de tilápia à milanesa com batata rústica e maionese caseira de limão', 48.00, 8),

    -- Burgers
    (c_burgers, 'Oldwest Burger', 'Hambúrguer de costelinha de porco (ou vegetariano), maionese, queijo canastra, geleia de pimenta e rúcula', 28.00, 1),
    (c_burgers, 'Porks Bacon Burger', 'Hambúrguer de costelinha de porco (ou vegetariano), maionese, creme de cheddar e tiras de bacon crocante', 26.00, 2),
    (c_burgers, 'Blues Burger', 'Hambúrguer de costelinha de porco (ou vegetariano), maionese, creme de gorgonzola, tiras de bacon e cebola caramelizada', 29.00, 3),

    -- Sanduíches
    (c_sanduiches, 'Pork Burrito', 'Burrito mexicano recheado com pernil desfiado, cheddar, sour cream, cebola caramelizada e chips de batata', 28.00, 1),
    (c_sanduiches, 'Beef Burrito', 'Burrito mexicano recheado com tiras de alcatra, cheddar, sour cream, cebola caramelizada e chips de batata', 35.00, 2),
    (c_sanduiches, 'Pernil Municipal', 'Sanduíche de pernil de porco marinado por 12h, coberto por queijo muçarela, maionese e cheiro verde', 26.00, 3),
    (c_sanduiches, 'Americano', 'Pão, tiras de alcatra, maionese, queijo, alface americana e tomate', 32.00, 4),
    (c_sanduiches, 'Choripork', 'Pão, linguicinha fina, maionese, queijo e chimichurri', 25.00, 5),
    (c_sanduiches, 'Pão com Bife Clássico', 'Tiras de alcatra bovina, maionese, queijo derretido e cebola', 29.00, 6),

    -- Doces
    (c_doces, 'Mini Churros', 'Porção de mini churros recheados de doce de leite', 25.00, 1);
END $$;
