import { CreateOrderRequest } from '../types/order';

export const validOrder = {
  symbol: 'ACME',
  side: 'Buy',
  quantity: 100,
  limitPrice: 150.0,
} as const satisfies CreateOrderRequest;

/** Returns a fresh order object with a guaranteed unique clientOrderId */
export const uniqueOrder = () => ({
  ...validOrder,
  clientOrderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
});
