"use client";

import { useStore } from "@/context/StoreProvider";
import { HeartIcon } from "./icons";

export default function WishButton({ productId, name, className = "wish" }: { productId: string; name: string; className?: string }) {
  const { wishlist, toggleWish, showToast, ready } = useStore();
  const on = ready && wishlist.includes(productId);
  return (
    <button
      type="button"
      className={className}
      aria-pressed={on}
      aria-label={`${on ? "Remove" : "Save"} ${name}`}
      onClick={(e) => {
        e.preventDefault();
        const nowOn = toggleWish(productId);
        showToast(nowOn ? `Saved ${name}` : "Removed from saved");
      }}
    >
      <HeartIcon filled={on} />
    </button>
  );
}
