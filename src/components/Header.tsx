"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/context/StoreProvider";
import { BagIcon, HeartIcon, SearchIcon } from "./icons";

export default function Header() {
  const params = useSearchParams();
  const { cart, wishlist, openBag, ready } = useStore();
  const bagCount = ready ? cart.reduce((n, l) => n + l.qty, 0) : 0;
  const savedCount = ready ? wishlist.length : 0;

  return (
    <>
      <div className="announce">
        <div className="wrap">
          Free shipping above ₹1,499 · Cash on delivery available · <b>FIRST10</b> takes 10% off your first order
        </div>
      </div>
      <header className="site">
        <div className="wrap head">
          <Link href="/" className="brand" aria-label="Loom and Lapel home">
            <span className="mark">L&amp;L</span>
            <span className="word">Loom &amp; Lapel</span>
          </Link>

          {/* Plain GET form: search works even before JavaScript loads */}
          <form action="/" method="get" className="search" role="search">
            <SearchIcon />
            <label htmlFor="q" className="sr-only">Search products</label>
            <input
              id="q"
              name="q"
              type="search"
              placeholder="Search shirts, linen, kurtas…"
              defaultValue={params.get("q") ?? ""}
              key={params.get("q") ?? ""}
              autoComplete="off"
            />
          </form>

          <div className="head-actions">
            <Link href="/?saved=1" className="icon-btn" aria-label={`Saved items, ${savedCount}`}>
              <HeartIcon size={20} />
              <span className="lbl">Saved</span>
              <span className="count" data-zero={savedCount === 0 || undefined}>{savedCount}</span>
            </Link>
            <button type="button" className="icon-btn" onClick={openBag} aria-label={`Open bag, ${bagCount} item${bagCount === 1 ? "" : "s"}`}>
              <BagIcon />
              <span className="lbl">Bag</span>
              <span className="count" data-zero={bagCount === 0 || undefined}>{bagCount}</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
