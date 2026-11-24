# Loom & Lapel — men's clothing store

Next.js 15 (App Router, TypeScript) storefront with Supabase for products, stock and orders, Razorpay for online payment, and optional Shiprocket shipment creation.

## What it does

- Catalogue with category, size, fit and price filters, sorting, search and a saved-items list
- Product pages with size picker (sold-out sizes disabled, low-stock note), size guide, pincode delivery estimate and SEO structured data
- Bag drawer with quantities, free-shipping progress (₹1,499), and coupons checked against the database
- Checkout with Indian address validation, pincode → city/state prefill, Razorpay (UPI, cards, net banking, wallets) or cash on delivery (+₹49, up to ₹10,000)
- Server re-prices every order from the database, reserves stock atomically, verifies Razorpay signatures, and handles the webhook as a backup
- Products without a photo are drawn as garment illustrations from their colour, cut and pattern

## File structure

```
loom-and-lapel/
├── README.md
├── package.json
├── next.config.ts                     # R2 image host, build settings
├── tsconfig.json
├── .env.example                       # every variable the app reads
├── .gitignore
├── supabase/
│   ├── migrations/
│   │   └── 0001_init.sql              # tables, RLS, create_order / cancel_order / expire_pending_orders
│   └── seed.sql                       # 24 sample products × 5 sizes, coupons FIRST10 and SAVE300
└── src/
    ├── app/
    │   ├── layout.tsx                 # fonts, header, footer, bag drawer, toast
    │   ├── globals.css                # all styles (light + dark)
    │   ├── page.tsx                   # home: hero + catalogue  (/?cat=shirts&q=linen&saved=1)
    │   ├── not-found.tsx
    │   ├── products/[slug]/page.tsx   # product page
    │   ├── checkout/page.tsx
    │   ├── orders/[id]/page.tsx       # order confirmation / status
    │   └── api/
    │       ├── orders/route.ts            # POST: validate, re-price, reserve stock, create Razorpay order
    │       ├── payments/verify/route.ts   # POST: verify checkout signature, mark paid
    │       ├── webhooks/razorpay/route.ts # POST: payment.captured backup
    │       └── coupons/validate/route.ts  # POST: look up a coupon
    ├── components/
    │   ├── Header.tsx  Footer.tsx  Toast.tsx  icons.tsx
    │   ├── Catalogue.tsx              # filters, sort, chips, grid
    │   ├── ProductCard.tsx  ProductImage.tsx  Garment.tsx  Price.tsx  WishButton.tsx
    │   ├── ProductActions.tsx         # size, quantity, add to bag
    │   ├── SizeGuide.tsx  PincodeCheck.tsx
    │   ├── CartDrawer.tsx  OrderSummary.tsx
    │   └── CheckoutForm.tsx           # address form + Razorpay Checkout
    ├── context/
    │   └── StoreProvider.tsx          # bag, saved items, coupon, toast (localStorage)
    └── lib/
        ├── types.ts  catalog.ts  format.ts  summary.ts
        ├── pricing.ts                 # one totals function used by browser and server
        ├── delivery.ts                # pincode checks, delivery estimate, states
        ├── supabase.ts                # anon client (catalogue) + service-role client (orders)
        ├── products.ts  coupons.ts
        ├── razorpay.ts                # client + signature checks
        ├── shiprocket.ts              # login + create adhoc order
        └── orders.ts                  # mark paid (idempotent) + push to Shiprocket
```

## Setup

1. **Install**
   ```bash
   npm install
   cp .env.example .env.local
   ```
2. **Database.** Create a Supabase project, then run `supabase/migrations/0001_init.sql` and `supabase/seed.sql` in the SQL editor (or `supabase db push` with the CLI). Copy the URL, anon key and service-role key into `.env.local`.
3. **Release unpaid stock.** Enable the `pg_cron` extension and run:
   ```sql
   select cron.schedule('expire-unpaid-orders', '*/10 * * * *', $$select public.expire_pending_orders(30)$$);
   ```
4. **Razorpay.** Add your test key ID and secret. Under Webhooks, add `https://<your-domain>/api/webhooks/razorpay`, subscribe to `payment.captured`, and put the same secret in `RAZORPAY_WEBHOOK_SECRET`.
5. **Shiprocket (optional).** Add your API user's email and password and the pickup location name. Leave blank to ship manually.
6. **Run**
   ```bash
   npm run dev     # http://localhost:3000
   npm run build && npm start
   ```

## How an order flows

1. The browser sends the bag (product IDs, sizes, quantities), address, coupon code and payment method to `POST /api/orders`.
2. The server loads prices and stock from Supabase, recomputes totals with `lib/pricing.ts`, and calls `create_order()`, which inserts the order and decrements stock in one transaction.
3. **Cash on delivery:** the order is `cod_confirmed` and pushed to Shiprocket.
   **Online:** a Razorpay order is created and Razorpay Checkout opens. On success the browser calls `/api/payments/verify`; the webhook covers closed tabs. Both paths are idempotent.
4. Unpaid online orders are cancelled after 30 minutes and their stock returned. A payment that lands after cancellation is flagged `needs_review`.

## Images

Upload photos to your Cloudflare R2 bucket and set `products.image_url`. Put the bucket's public hostname in `IMAGE_HOST`. Products without a photo keep the drawn illustration.

## Where to go next

- Admin screens for products, stock and orders (or manage them in Supabase Studio for now)
- Customer accounts with Supabase Auth and order history
- Courier-accurate delivery dates from Shiprocket's serviceability API instead of `estimateDelivery()`
- Order emails or WhatsApp updates on status changes
- Moving the API routes to your Deno API if you want one backend for web and the Flutter app; they only depend on `src/lib`
# clothing-ecommerce
