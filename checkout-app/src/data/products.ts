import type { Product } from "../types"

const PRODUCTS: Record<string, Product> = {
  prod_123: {
    id: "prod_123",
    name: "Dodo pro plan",
    description: "Monthly subscription, billed to your card",
    priceInCents: 4900,
  },
};

export function fetchProduct(productId: string): Promise<Product | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(PRODUCTS[productId] ?? null);
    }, 2000);
  });
}