-- Loom & Lapel: catalogue, stock, coupons and orders
-- Prices are stored in whole rupees (INR, GST inclusive). Razorpay amounts are converted to paise in code.

create extension if not exists pgcrypto;

-- ───────────────────────── Catalogue ─────────────────────────
create table public.products (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  category       text not null check (category in ('shirts','polos','trousers','denim','blazers','ethnic')),
  description    text not null default '',
  fit            text not null,
  fabric         text not null,
  weight         text not null default '',
  care           text not null default '',
  color_name     text not null,
  color_hex      text not null check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  -- Illustration fallback used when image_url is null
  shape          text not null check (shape in ('shirt','polo','tee','henley','trouser','jeans','blazer','bandh','kurta')),
  pattern        text not null default 'solid' check (pattern in ('solid','stripe','hstripe','check','denim')),
  pattern_hex    text check (pattern_hex is null or pattern_hex ~ '^#[0-9A-Fa-f]{6}$'),
  collar         text check (collar in ('mandarin')),
  trim           boolean not null default false,
  drawstring     boolean not null default false,
  price          integer not null check (price > 0),
  mrp            integer not null check (mrp >= price),
  rating         numeric(2,1) not null default 0,
  review_count   integer not null default 0,
  tag            text,
  image_url      text,
  is_active      boolean not null default true,
  sort_order     integer not null default 100,
  created_at     timestamptz not null default now()
);
create index products_category_idx on public.products (category) where is_active;

create table public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  size        text not null,
  sku         text not null unique,
  stock       integer not null default 0 check (stock >= 0),
  unique (product_id, size)
);

-- ───────────────────────── Coupons ─────────────────────────
create table public.coupons (
  code          text primary key check (code = upper(code)),
  kind          text not null check (kind in ('percent','flat')),
  value         integer not null check (value > 0),
  max_discount  integer,
  min_subtotal  integer not null default 0,
  is_active     boolean not null default true,
  expires_at    timestamptz
);

-- ───────────────────────── Orders ─────────────────────────
create sequence public.order_no_seq start 100001;

create table public.orders (
  id                      uuid primary key default gen_random_uuid(),
  order_no                text not null unique,
  status                  text not null check (status in
                            ('pending_payment','paid','cod_confirmed','shipped','delivered','cancelled','needs_review')),
  payment_method          text not null check (payment_method in ('online','cod')),
  customer_name           text not null,
  phone                   text not null,
  email                   text,
  address_line1           text not null,
  address_line2           text,
  city                    text not null,
  state                   text not null,
  pincode                 text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  mrp_total               integer not null,
  subtotal                integer not null,
  coupon_code             text,
  coupon_discount         integer not null default 0,
  shipping_fee            integer not null default 0,
  cod_fee                 integer not null default 0,
  total                   integer not null,
  razorpay_order_id       text unique,
  razorpay_payment_id     text,
  shiprocket_order_id     text,
  shiprocket_shipment_id  text,
  fulfilment_error        text,
  created_at              timestamptz not null default now(),
  paid_at                 timestamptz
);
create index orders_status_created_idx on public.orders (status, created_at);

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid not null references public.products(id),
  variant_id    uuid not null references public.product_variants(id),
  product_name  text not null,
  size          text not null,
  sku           text not null,
  unit_price    integer not null,
  qty           integer not null check (qty between 1 and 10),
  line_total    integer not null
);
create index order_items_order_idx on public.order_items (order_id);

-- ───────────────────────── Row level security ─────────────────────────
-- Shoppers (anon key) can only read the active catalogue.
-- Coupons and orders are only reachable through the service role in API routes.
alter table public.products          enable row level security;
alter table public.product_variants  enable row level security;
alter table public.coupons           enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;

create policy "read active products" on public.products
  for select to anon, authenticated using (is_active);

create policy "read variants of active products" on public.product_variants
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active));

-- ───────────────────────── Order functions ─────────────────────────
-- Creates the order, its items and decrements stock in one transaction.
-- Raises OUT_OF_STOCK:<variant_id> and rolls everything back if any size has run out.
create or replace function public.create_order(p jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_id   uuid;
  v_no   text;
  v_item jsonb;
  v_rows int;
begin
  v_no := 'LL' || nextval('public.order_no_seq');

  insert into public.orders (
    order_no, status, payment_method, customer_name, phone, email,
    address_line1, address_line2, city, state, pincode,
    mrp_total, subtotal, coupon_code, coupon_discount, shipping_fee, cod_fee, total
  ) values (
    v_no,
    case when p->>'payment_method' = 'cod' then 'cod_confirmed' else 'pending_payment' end,
    p->>'payment_method', p->>'customer_name', p->>'phone', nullif(p->>'email',''),
    p->>'address_line1', nullif(p->>'address_line2',''), p->>'city', p->>'state', p->>'pincode',
    (p->>'mrp_total')::int, (p->>'subtotal')::int, nullif(p->>'coupon_code',''),
    (p->>'coupon_discount')::int, (p->>'shipping_fee')::int, (p->>'cod_fee')::int, (p->>'total')::int
  ) returning id into v_id;

  for v_item in select * from jsonb_array_elements(p->'items') loop
    update public.product_variants
       set stock = stock - (v_item->>'qty')::int
     where id = (v_item->>'variant_id')::uuid
       and stock >= (v_item->>'qty')::int;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'OUT_OF_STOCK:%', v_item->>'variant_id';
    end if;

    insert into public.order_items (order_id, product_id, variant_id, product_name, size, sku, unit_price, qty, line_total)
    values (
      v_id, (v_item->>'product_id')::uuid, (v_item->>'variant_id')::uuid,
      v_item->>'product_name', v_item->>'size', v_item->>'sku',
      (v_item->>'unit_price')::int, (v_item->>'qty')::int, (v_item->>'line_total')::int
    );
  end loop;

  return jsonb_build_object('id', v_id, 'order_no', v_no);
end;
$$;

-- Cancels an unpaid order and returns its stock.
create or replace function public.cancel_order(p_order uuid)
returns boolean
language plpgsql
as $$
begin
  update public.orders set status = 'cancelled'
   where id = p_order and status = 'pending_payment';
  if not found then
    return false;
  end if;

  update public.product_variants v
     set stock = v.stock + oi.qty
    from (select variant_id, sum(qty)::int as qty
            from public.order_items where order_id = p_order
           group by variant_id) oi
   where v.id = oi.variant_id;
  return true;
end;
$$;

-- Releases stock held by online orders that were never paid.
create or replace function public.expire_pending_orders(p_minutes int default 30)
returns int
language plpgsql
as $$
declare
  r record;
  n int := 0;
begin
  for r in
    select id from public.orders
     where status = 'pending_payment'
       and created_at < now() - make_interval(mins => p_minutes)
  loop
    if public.cancel_order(r.id) then n := n + 1; end if;
  end loop;
  return n;
end;
$$;

-- These run with the service role only; keep them off the public RPC surface.
revoke execute on function public.create_order(jsonb)          from public, anon, authenticated;
revoke execute on function public.cancel_order(uuid)           from public, anon, authenticated;
revoke execute on function public.expire_pending_orders(int)   from public, anon, authenticated;

-- Run the expiry every 10 minutes (enable the pg_cron extension in Supabase first):
-- select cron.schedule('expire-unpaid-orders', '*/10 * * * *', $$select public.expire_pending_orders(30)$$);
