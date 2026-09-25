export type CheckoutMessage =
  | { type: "READY" }
  | { type: "SUCCESS"; sessionId: string }
  | { type: "ERROR"; code: string; message: string }
  | { type: "CLOSED"; reason: "user_closed" | "success" };

export type Product = {
  id: string,
  name: string,
  description: string,
  priceInCents: number
};

export type AppState = "loading" | "form" | "processing" | "success" | "fatal_error";