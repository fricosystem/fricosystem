import { httpsCallable } from "firebase/functions";
import { firebaseFunctions as functions } from "@/firebase/firebase";

export interface ProductQuote {
  supplier: string;
  address: string;
  distance: number;
  price: number;
  payment: string;
  delivery: string;
}

export interface QuoteResponse {
  quotes: ProductQuote[];
}

export async function getProductQuotes(productName: string, location?: { lat: number; lng: number }): Promise<QuoteResponse> {
  const callable = httpsCallable<{ productName: string; location?: { lat: number; lng: number } }, QuoteResponse>(
    functions,
    "getProductPriceQuotes"
  );

  const result = await callable({ productName, location });
  return result.data;
}
