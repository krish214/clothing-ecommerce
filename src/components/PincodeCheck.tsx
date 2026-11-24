"use client";

import { useState } from "react";
import { estimateDelivery, isValidPincode } from "@/lib/delivery";

export default function PincodeCheck() {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="pin"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValidPincode(pin)) {
          setResult({ ok: false, text: "Enter a valid 6-digit pincode." });
          return;
        }
        const r = estimateDelivery(pin);
        setResult({ ok: true, text: `Delivery by ${r.label} · Cash on delivery available` });
      }}
    >
      <label htmlFor="pin">Check delivery date</label>
      <div className="row">
        <input
          id="pin"
          inputMode="numeric"
          maxLength={6}
          placeholder="Pincode"
          autoComplete="postal-code"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        />
        <button className="btn ghost sm" type="submit">Check</button>
      </div>
      <p className={`pin-out${result ? (result.ok ? " ok" : " bad") : ""}`} aria-live="polite">
        {result?.text ?? "Ships from Chennai. Cash on delivery available on most pincodes."}
      </p>
    </form>
  );
}
