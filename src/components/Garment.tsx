import type { ReactNode, SVGProps } from "react";
import type { GarmentLook } from "@/lib/types";

/**
 * Flat garment illustration drawn from the product's colour, cut and pattern.
 * Used wherever a product has no photo yet (image_url is null).
 */
const BODY: Record<string, string> = {
  shirt: "M72 30 L44 40 Q30 46 27 72 L18 172 L38 175 L50 96 L50 214 Q100 224 150 214 L150 96 L162 175 L182 172 L173 72 Q170 46 156 40 L128 30 Q100 46 72 30 Z",
  tee: "M70 30 L42 40 L16 82 L42 96 L52 82 L52 214 Q100 222 148 214 L148 82 L158 96 L184 82 L158 40 L130 30 Q100 52 70 30 Z",
  trouser: "M56 24 L144 24 L152 226 L112 228 L100 92 L88 228 L48 226 Z",
  blazer: "M70 24 L42 34 Q28 40 25 68 L16 178 L36 181 L48 98 L46 226 Q100 236 154 226 L152 98 L164 181 L184 178 L175 68 Q172 40 158 34 L130 24 L100 122 Z",
  bandh: "M70 24 L42 34 Q28 40 25 68 L16 178 L36 181 L48 98 L46 222 Q100 232 154 222 L152 98 L164 181 L184 178 L175 68 Q172 40 158 34 L130 24 Q100 36 70 24 Z",
  kurta: "M72 24 L46 34 Q32 40 29 66 L20 168 L40 171 L52 92 L50 232 L150 232 L148 92 L160 171 L180 168 L171 66 Q168 40 154 34 L128 24 Q100 36 72 24 Z",
};
const BODY_FOR: Record<string, string> = { polo: "tee", henley: "tee", jeans: "trouser" };
const GOLD = "#C9A44A";
const BRASS = "#B9975A";
const STITCH = "#D39B47";

const HEX = /^#[0-9a-f]{6}$/i;

export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (x: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? x * (1 + amt) : x + (255 - x) * amt)));
  return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("");
}

function PatternDef({ id, pattern, color }: { id: string; pattern: string; color: string }) {
  switch (pattern) {
    case "stripe":
      return (
        <pattern id={id} width="9" height="9" patternUnits="userSpaceOnUse">
          <rect width="2" height="9" fill={color} />
        </pattern>
      );
    case "hstripe":
      return (
        <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="5" fill={color} />
        </pattern>
      );
    case "check":
      return (
        <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="7" fill={color} opacity=".55" />
          <rect width="7" height="28" fill={color} opacity=".55" />
          <rect y="17" width="28" height="1.5" fill="#F2E2AE" opacity=".7" />
          <rect x="17" width="1.5" height="28" fill="#F2E2AE" opacity=".7" />
        </pattern>
      );
    case "denim":
      return (
        <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <rect width="1.2" height="5" fill="#FFFFFF" opacity=".14" />
        </pattern>
      );
    default:
      return null;
  }
}

export default function Garment({ look, className }: { look: GarmentLook; className?: string }) {
  const base = HEX.test(look.colorHex) ? look.colorHex : "#888888";
  const dk = shade(base, -0.34);
  const patColor = look.patternHex && HEX.test(look.patternHex) ? look.patternHex : "#000000";
  const hasPat = look.pattern !== "solid";
  // Same look → same pattern, so a shared id is harmless; avoids hooks so this also renders on the server.
  const id = `pat-${look.pattern}-${base.slice(1)}-${patColor.slice(1)}`;

  const stroke = { stroke: dk, strokeWidth: 1.6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const Part = ({ d }: { d: string }) => (
    <g>
      <path d={d} fill={base} />
      {hasPat && <path d={d} fill={`url(#${id})`} />}
      <path d={d} fill="none" {...stroke} />
    </g>
  );
  const Line = ({ d, ...rest }: { d: string } & SVGProps<SVGPathElement>) => <path d={d} fill="none" {...stroke} {...rest} />;
  const Dot = ({ cx, cy, r = 2.2, fill = dk }: { cx: number; cy: number; r?: number; fill?: string }) => (
    <circle cx={cx} cy={cy} r={r} fill={fill} />
  );

  let before: ReactNode = null;
  let details: ReactNode = null;

  switch (look.shape) {
    case "shirt":
      details = (
        <>
          {Line({ d: "M100 40 L100 216" })}
          {[62, 92, 122, 152, 182].map((y) => <g key={y}>{Dot({ cx: 104, cy: y })}</g>)}
          {Line({ d: "M112 78 h22 v22 q-11 5 -22 0 Z" })}
          {Line({ d: "M20 160 L40 163 M160 163 L180 160" })}
          {look.collar === "mandarin"
            ? Part({ d: "M74 30 Q100 44 126 30 L126 22 Q100 36 74 22 Z" })
            : Part({ d: "M72 30 L84 19 L100 36 L116 19 L128 30 L113 52 L100 40 L87 52 Z" })}
        </>
      );
      break;
    case "tee":
      details = (
        <>
          <path d="M70 30 Q100 52 130 30" fill="none" stroke={dk} strokeWidth={4} strokeLinecap="round" />
          {Line({ d: "M20 75 L45 88 M180 75 L155 88" })}
          {Line({ d: "M53 204 Q100 212 147 204", opacity: 0.5 })}
        </>
      );
      break;
    case "polo":
      details = (
        <>
          {Line({ d: "M20 75 L45 88 M180 75 L155 88" })}
          <rect x="95" y="38" width="10" height="42" fill="none" {...stroke} />
          {Dot({ cx: 100, cy: 54 })}
          {Dot({ cx: 100, cy: 68 })}
          {Part({ d: "M72 30 L80 21 L100 38 L120 21 L128 30 L114 46 L100 40 L86 46 Z" })}
        </>
      );
      break;
    case "henley":
      details = (
        <>
          <path d="M70 30 Q100 52 130 30" fill="none" stroke={dk} strokeWidth={4} strokeLinecap="round" />
          {Line({ d: "M20 75 L45 88 M180 75 L155 88" })}
          <rect x="96" y="41" width="8" height="34" fill="none" {...stroke} />
          {Dot({ cx: 100, cy: 52, r: 2 })}
          {Dot({ cx: 100, cy: 64, r: 2 })}
        </>
      );
      break;
    case "trouser":
    case "jeans":
      details = (
        <>
          {Part({ d: "M56 24 L144 24 L145 38 L55 38 Z" })}
          {Line({ d: "M100 38 L100 90 M107 38 Q109 72 100 90" })}
          {Line({ d: "M60 40 Q72 56 66 74 M140 40 Q128 56 134 74" })}
          {look.shape === "trouser" && Line({ d: "M76 44 L70 224 M124 44 L130 224", opacity: 0.35 })}
          {[70, 98, 128].map((x) => <rect key={x} x={x} y="21" width="4" height="19" rx="1" fill={base} {...stroke} />)}
          {look.drawstring && Line({ d: "M96 34 q-6 14 -12 22 M104 34 q6 14 12 22" })}
          {look.shape === "jeans" && (
            <g fill="none" stroke={STITCH} strokeWidth={1.2} strokeDasharray="3 2.5">
              <path d="M57 34.5 L143 34.5" />
              <path d="M63 42 Q74 58 69 73" />
              <path d="M137 42 Q126 58 131 73" />
              <path d="M103 40 Q105 70 98 86" />
            </g>
          )}
          {look.shape === "jeans" && (
            <>
              {Dot({ cx: 100, cy: 31, r: 3, fill: BRASS })}
              {Dot({ cx: 64, cy: 44, r: 1.8, fill: BRASS })}
              {Dot({ cx: 136, cy: 44, r: 1.8, fill: BRASS })}
            </>
          )}
        </>
      );
      break;
    case "blazer":
      before = <path d="M70 24 Q100 32 130 24 L100 122 Z" fill="#F3F2EE" stroke="#BDBBB4" strokeWidth={1.2} />;
      details = (
        <>
          {Part({ d: "M70 24 L100 122 L92 84 L76 66 L82 50 Z" })}
          {Part({ d: "M130 24 L100 122 L108 84 L124 66 L118 50 Z" })}
          {Dot({ cx: 100, cy: 146, r: 3.4 })}
          {Dot({ cx: 100, cy: 172, r: 3.4 })}
          {Line({ d: "M58 178 L88 176 M112 176 L142 178", strokeWidth: 2.4 })}
          {Line({ d: "M114 98 L138 95", strokeWidth: 2.4 })}
        </>
      );
      break;
    case "bandh":
      details = (
        <>
          {Line({ d: "M100 30 L100 222" })}
          {[52, 80, 108, 136, 164, 192].map((y) => <g key={y}>{Dot({ cx: 100, cy: y, r: 3, fill: BRASS })}</g>)}
          {Line({ d: "M58 176 L86 174 M114 174 L142 176", strokeWidth: 2.4 })}
          {Part({ d: "M72 24 Q100 36 128 24 L128 14 Q100 26 72 14 Z" })}
        </>
      );
      break;
    case "kurta":
      details = (
        <>
          {Line({ d: "M100 30 L100 92" })}
          {[46, 62, 78].map((y) => <g key={y}>{Dot({ cx: 100, cy: y })}</g>)}
          {Line({ d: "M51 192 L51 232 M149 192 L149 232" })}
          {Part({ d: "M74 24 Q100 36 126 24 L126 15 Q100 27 74 15 Z" })}
          {look.trim && (
            <>
              <path d="M50 220 L150 220 L150 232 L50 232 Z" fill={GOLD} />
              <path d="M21 158 L41 161 L40 171 L20 168 Z M159 161 L179 158 L180 168 L160 171 Z" fill={GOLD} />
              <path d="M75 19 Q100 31 125 19" fill="none" stroke={GOLD} strokeWidth={2} />
            </>
          )}
        </>
      );
      break;
  }

  return (
    <svg className={["garment", className].filter(Boolean).join(" ")} viewBox="0 0 200 240" aria-hidden="true" focusable="false">
      {hasPat && (
        <defs>
          <PatternDef id={id} pattern={look.pattern} color={patColor} />
        </defs>
      )}
      {before}
      {Part({ d: BODY[BODY_FOR[look.shape] ?? look.shape] })}
      {details}
    </svg>
  );
}
