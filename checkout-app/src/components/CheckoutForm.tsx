import { useState } from "react";
import type { Product } from "../types";
import { formatCardNumber, formatExpiry, isValidEmail, isValidExpiry } from "../lib/validation";

type Props = {
  product: Product;
  isSubmitting: boolean;
  paymentError: string | null;
  onSubmit: (cardNumber: string, email: string) => void;
  onClose: () => void;
}

export function CheckoutForm({ product, isSubmitting, paymentError, onSubmit, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const cardDigits = cardNumber.replace(/\s/g, "");
  const isFormValid = isValidEmail(email) && cardDigits.length === 16 && isValidExpiry(expiry) && cvc.length === 3;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    onSubmit(cardDigits, email);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <p className="text-sm text-gray-500">{product.name}</p>
          <p className="text-lg font-semibold text-gray-900">
            ${(product.priceInCents / 100).toFixed(2)}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close Checkout"
          className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 px-6 py-6">
        {paymentError && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2" role="alert">
            {paymentError}
          </div>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline focus:ring-2 focus:ring-gray-900"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Card number</span>
          <input
            type="text"
            inputMode="numeric"
            required
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="4242 4242 4242 4242"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </label>

        <div className="flex gap-3">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-sm font-medium text-gray-700">Expiry</span>
            <input
              type="text"
              inputMode="numeric"
              required
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-sm font-medium text-gray-700">CVC</span>
            <input
              type="text"
              inputMode="numeric"
              required
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="123"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="mt-2 rounded-lg bg-gray-900 text-white text-sm font-medium py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          {isSubmitting ? "Processing…" : `Pay $${(product.priceInCents / 100).toFixed(2)}`}
        </button>
      </form>
    </div>
  )
}