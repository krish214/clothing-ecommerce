const inr = new Intl.NumberFormat("en-IN");

export const formatINR = (n: number) => "₹" + inr.format(n);

export const discountPct = (price: number, mrp: number) =>
  mrp > price ? Math.round((1 - price / mrp) * 100) : 0;
