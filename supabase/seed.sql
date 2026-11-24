-- Sample catalogue: 24 styles, 5 sizes each, plus two coupons.
-- image_url is left null, so the storefront draws each garment as an illustration.
-- Upload photos to R2 and set image_url when you have them.

insert into public.products
  (slug, name, category, description, fit, fabric, weight, care, color_name, color_hex, shape, pattern, pattern_hex, collar, trim, drawstring, price, mrp, rating, review_count, tag, sort_order)
values
  ('oxford-button-down-sky','Oxford Button-Down Shirt','shirts','A soft Oxford weave with a button-down collar that holds its shape under a blazer or on its own.','Slim','100% cotton Oxford','140 GSM','Machine wash cold, warm iron','Sky Blue','#8DB0D8','shirt','solid',null,null,false,false,1499,1999,4.5,318,'Bestseller',1),
  ('silk-blend-festive-kurta-maroon','Silk-Blend Festive Kurta','ethnic','Knee-length kurta in art silk with a zari border at the hem, cuffs and collar.','Regular','Art silk with zari border','Knee length, 41 in','Dry clean only','Maroon','#6D1F2D','kurta','solid',null,null,true,false,2799,3499,4.6,184,'Festive',2),
  ('stretch-chinos-khaki','Stretch Chinos','trousers','Everyday chinos with a touch of stretch, a slim leg and a clean flat front.','Slim','98% cotton, 2% elastane twill','280 GSM','Machine wash, iron inside out','Khaki','#B39A6F','trouser','solid',null,null,false,false,1599,2199,4.4,402,'Bestseller',3),
  ('unstructured-cotton-blazer-navy','Unstructured Cotton Blazer','blazers','A soft-shouldered, half-lined blazer that breathes in warm weather.','Slim','Cotton twill, half-lined','300 GSM','Dry clean','Navy','#263259','blazer','solid',null,null,false,false,4999,6499,4.5,88,'New',4),
  ('pique-polo-forest','Piqué Polo','polos','Classic two-button polo in breathable cotton piqué.','Regular','Cotton piqué','220 GSM','Machine wash, dry flat','Forest Green','#2E5C45','polo','solid',null,null,false,false,999,1299,4.5,410,'Bestseller',5),
  ('madras-check-shirt','Madras Check Shirt','shirts','Lightweight handloom madras in a red and navy check.','Regular','Handloom cotton madras','110 GSM','Hand wash separately','Red / Navy check','#B5463B','shirt','check','#1F2C5A',null,false,false,1299,1699,4.3,142,'New',6),
  ('selvedge-slim-jeans-indigo','Selvedge Slim Jeans','denim','Raw selvedge denim that fades to fit you over time.','Slim','100% cotton selvedge denim','13.5 oz','Wash rarely, inside out, cold','Raw Indigo','#2B3C64','jeans','denim',null,null,false,false,2999,3999,4.7,156,null,7),
  ('jodhpuri-bandhgala-black','Jodhpuri Bandhgala','ethnic','Fully lined bandhgala with a closed collar and brass-tone buttons.','Slim','Jacquard poly-viscose, fully lined','320 GSM','Dry clean only','Black','#1C1D22','bandh','solid',null,null,false,false,5999,7499,4.6,73,'Festive',8),
  ('pure-linen-shirt-natural','Pure Linen Shirt','shirts','Relaxed linen shirt that gets softer with every wash.','Relaxed','100% linen','160 GSM','Gentle wash, line dry','Natural','#D6C8AA','shirt','solid',null,null,false,false,1799,2299,4.6,201,null,9),
  ('heavyweight-crew-tee-ecru','Heavyweight Crew Tee','polos','Dense, boxy tee that keeps its shape wash after wash.','Boxy','Combed cotton jersey','240 GSM','Machine wash, tumble low','Ecru','#EAE5DA','tee','solid',null,null,false,false,699,899,4.6,522,null,10),
  ('pleated-wool-blend-trousers-grey','Pleated Wool-Blend Trousers','trousers','Single-pleat trousers with a tapered leg for formal and festive wear.','Tapered','Wool-poly-viscose suiting','260 GSM','Dry clean','Mid Grey','#6D7079','trouser','solid',null,null,false,false,2499,2999,4.3,64,null,11),
  ('herringbone-check-blazer-brown','Herringbone Check Blazer','blazers','Fully lined tweed blazer for cooler evenings and travel.','Regular','Wool-blend tweed, fully lined','380 GSM','Dry clean','Brown check','#6E5843','blazer','check','#3A2C1F',null,false,false,6299,7999,4.4,41,null,12),
  ('classic-cotton-kurta-white','Classic Cotton Kurta','ethnic','Light mulmul kurta for daily wear and pujas.','Regular','Cotton mulmul','90 GSM','Machine wash gentle','White','#F0EDE4','kurta','solid',null,null,false,false,1299,1599,4.4,296,null,13),
  ('pinstripe-formal-shirt-white','Pinstripe Formal Shirt','shirts','Two-ply 80s count cotton with a fine indigo pinstripe.','Slim','2-ply cotton, 80s count','105 GSM','Machine wash, warm iron','White / Indigo stripe','#F1F1EE','shirt','stripe','#5262A8',null,false,false,1699,1999,4.4,96,null,14),
  ('breton-stripe-tee','Breton Stripe Tee','polos','Navy-striped cotton tee with a relaxed crew neck.','Regular','Cotton jersey','200 GSM','Machine wash cold','White / Navy stripe','#F2F0EA','tee','hstripe','#1F2C55',null,false,false,799,999,4.2,118,null,15),
  ('linen-drawstring-trousers-sand','Linen Drawstring Trousers','trousers','Easy linen-cotton trousers with a drawstring waist.','Relaxed','55% linen, 45% cotton','190 GSM','Gentle wash, line dry','Sand','#CBB894','trouser','solid',null,null,false,true,1699,1999,4.5,133,'New',16),
  ('straight-fit-jeans-mid-wash','Straight Fit Jeans','denim','A straight leg in comfortable stretch denim.','Straight','Cotton stretch denim','11 oz','Machine wash cold, inside out','Mid Wash','#4E6C98','jeans','denim',null,null,false,false,2299,2799,4.3,240,null,17),
  ('mandarin-collar-linen-shirt-olive','Mandarin Collar Linen Shirt','shirts','Band-collar shirt in a linen-cotton blend.','Regular','Linen-cotton blend','150 GSM','Gentle wash, line dry','Olive','#6E7553','shirt','solid',null,'mandarin',false,false,1599,1999,4.4,87,null,18),
  ('contrast-tipped-polo-navy','Contrast-Tipped Polo','polos','Slim polo with a little stretch for a sharper fit.','Slim','Cotton piqué with elastane','210 GSM','Machine wash cold','Navy','#1E2A4B','polo','solid',null,null,false,false,1099,1399,4.3,128,null,19),
  ('linen-blend-blazer-beige','Linen-Blend Blazer','blazers','Unlined summer blazer in a linen-viscose blend.','Slim','Linen-viscose, unlined','220 GSM','Dry clean','Beige','#C8B38D','blazer','solid',null,null,false,false,5499,5999,4.2,39,null,20),
  ('flat-front-formal-trousers-navy','Flat-Front Formal Trousers','trousers','Office trousers with a slim, clean line.','Slim','Poly-viscose suiting','240 GSM','Machine wash gentle','Navy','#232B46','trouser','solid',null,null,false,false,1899,2499,4.3,175,null,21),
  ('slub-henley-tee-mustard','Slub Henley Tee','polos','Textured slub cotton with a three-button placket.','Regular','Slub cotton jersey','180 GSM','Machine wash cold','Mustard','#C29531','henley','solid',null,null,false,false,749,999,4.1,66,null,22),
  ('indigo-short-kurta','Indigo Short Kurta','ethnic','Hip-length kurta that pairs with jeans or chinos.','Regular','Cotton cambric','Hip length, 32 in','Wash separately, cold','Indigo','#2D4777','kurta','solid',null,null,false,false,1099,1399,4.3,112,null,23),
  ('tapered-black-jeans','Tapered Black Jeans','denim','Washed black denim with a tapered leg.','Tapered','Cotton stretch denim','12 oz','Machine wash cold, inside out','Washed Black','#2A2C33','jeans','denim',null,null,false,false,2199,2699,4.4,189,null,24);

-- Five sizes per product: S–XXL for tops, waist 30–38 for trousers and denim.
-- A few sizes start sold out so the storefront shows that state.
with sold_out(slug, size) as (values
  ('oxford-button-down-sky','XXL'), ('stretch-chinos-khaki','38'), ('unstructured-cotton-blazer-navy','S'),
  ('selvedge-slim-jeans-indigo','30'), ('jodhpuri-bandhgala-black','XXL'), ('pure-linen-shirt-natural','S'),
  ('herringbone-check-blazer-brown','S'), ('herringbone-check-blazer-brown','M'), ('breton-stripe-tee','XL'),
  ('contrast-tipped-polo-navy','S'), ('contrast-tipped-polo-navy','XXL'), ('flat-front-formal-trousers-navy','30'),
  ('indigo-short-kurta','M')
)
insert into public.product_variants (product_id, size, sku, stock)
select p.id,
       s.size,
       upper(p.slug) || '-' || s.size,
       case when exists (select 1 from sold_out so where so.slug = p.slug and so.size = s.size) then 0 else 25 end
  from public.products p
 cross join lateral unnest(
         case when p.category in ('trousers','denim')
              then array['30','32','34','36','38']
              else array['S','M','L','XL','XXL'] end
       ) with ordinality as s(size, ord);

insert into public.coupons (code, kind, value, max_discount, min_subtotal) values
  ('FIRST10', 'percent', 10, 500, 0),
  ('SAVE300', 'flat', 300, null, 2999);
