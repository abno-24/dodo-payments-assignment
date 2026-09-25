import type { Product } from "../types";

type Props = {
  product: Product;
};

export function SuccessScreen({ product }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center gap-3">
      <div className="h=12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 text-2xl">
        ✓
      </div>
      <p className="text-lg font-semibold text-gray-900">Payment Successful</p>
      <p className="text-sm text-gray-500">
        {product.name} · ${(product.priceInCents / 100).toFixed(2)}
      </p>
    </div>
  )
}