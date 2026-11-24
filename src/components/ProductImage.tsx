import Image from "next/image";
import Garment from "./Garment";
import type { ProductSummary } from "@/lib/types";

/** Photo from R2 when one exists, otherwise the drawn garment. */
export default function ProductImage({
  product,
  sizes = "(max-width: 600px) 50vw, 25vw",
  priority = false,
}: {
  product: ProductSummary;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className="tile">
      {product.imageUrl ? (
        <Image src={product.imageUrl} alt={product.name} fill sizes={sizes} priority={priority} className="tile-photo" />
      ) : (
        <Garment look={product} />
      )}
    </div>
  );
}
