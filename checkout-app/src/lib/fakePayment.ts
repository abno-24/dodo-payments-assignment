export type PaymentResult =
  | { outcome: "success" }
  | { outcome: "declined"; message: string }
  | { outcome: "failed"; message: string };

const attemptCounts = new Map<string, number>();

export function simulatePayment(cardNumber: string): Promise<PaymentResult> {
  const cleaned = cardNumber.replace(/\s/g, "");
  const attempt = (attemptCounts.get(cleaned) ?? 0) + 1;
  attemptCounts.set(cleaned, attempt);

  return new Promise((resolve) => {
    setTimeout(() => {
      if (cleaned === "4242424242424242") {
        resolve({ outcome: "success" });
        return;
      }

      if (cleaned === "4000000000000002") {
        resolve({ outcome: "declined", message: "Your card was declined." });
        return;
      }

      if (cleaned === "4000000000000341") {
        if (attempt === 1) {
          resolve({ outcome: "failed", message: "Payment failed. Please try again." })
        } else {
          resolve({ outcome: "success" });
        }
        return;
      }

      resolve({ outcome: "declined", message: "Your card was declined." })
    }, 1200);
  });
}