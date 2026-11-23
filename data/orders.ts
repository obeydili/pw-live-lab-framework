import { uniqueClientOrderId } from '../helpers/test-data';
import type { CreateOrderRequest } from '../types/order';

export const validOrder = {
  symbol: 'ACME',
  side: 'Buy',
  quantity: 100,
  limitPrice: 150.0,
} as const satisfies CreateOrderRequest;

export const newOrder = (overrides: Partial<CreateOrderRequest> = {}): CreateOrderRequest => ({
  symbol: 'BLUE',
  side: 'Sell',
  quantity: 25,
  limitPrice: 40.5,
  clientOrderId: uniqueClientOrderId(),
  ...overrides,
});

/** Returns a fresh order object with a guaranteed unique clientOrderId */
export const uniqueOrder = () => ({
  ...validOrder,
  clientOrderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
});
