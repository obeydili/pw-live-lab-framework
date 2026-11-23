import { APIRequestContext, APIResponse } from '@playwright/test';
import { readJson } from './readJson';
import type { LoginResponse, UserInfo, CreateOrderRequest, Order } from '../types/order';

/** A non-2xx answer from the API, with the status and parsed body for assertions. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function ensureOk(res: APIResponse, action: string): Promise<void> {
  if (res.ok()) return;
  const body: unknown = await res.json().catch(() => null);
  throw new ApiError(
    `Failed to ${action}: ${res.status()} ${res.statusText()}`,
    res.status(),
    body,
  );
}

export class ApiClient {
  private token: string | null = null;

  constructor(private readonly request: APIRequestContext) {}

  async login(username: string, password: string): Promise<void> {
    const loginResponse: APIResponse = await this.request.post('/api/auth/login', {
      data: {
        username: username,
        password: password,
      },
    });
    await ensureOk(loginResponse, 'login');

    const data = await readJson<LoginResponse>(loginResponse);
    this.token = data.token;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async reset(): Promise<APIResponse> {
    return await this.request.post('/api/test/reset', {
      headers: this.getHeaders(),
    });
  }

  async me(): Promise<UserInfo> {
    const res = await this.request.get('/api/me', {
      headers: this.getHeaders(),
    });
    await ensureOk(res, 'get the current user');
    return await readJson<UserInfo>(res);
  }

  async createOrder(order: CreateOrderRequest): Promise<Order> {
    const res = await this.request.post('/api/orders', {
      headers: this.getHeaders(),
      data: order,
    });
    await ensureOk(res, 'create order');
    return await readJson<Order>(res);
  }

  async getOrder(id: string): Promise<Order> {
    const res = await this.request.get(`/api/orders/${id}`, {
      headers: this.getHeaders(),
    });
    await ensureOk(res, 'get order');
    return await readJson<Order>(res);
  }

  async getOrders(
    params?: Record<string, string | number>,
  ): Promise<{ items: Order[]; totalCount: number }> {
    const res = await this.request.get('api/orders', {
      headers: this.getHeaders(),
      params,
    });
    await ensureOk(res, 'get orders');
    const headers = res.headers();
    return {
      items: await res.json(),
      totalCount: Number(headers['x-total-count'] ?? 0),
    };
  }

  async approveOrder(id: string): Promise<Order> {
    const res = await this.request.post(`/api/orders/${id}/approve`, {
      headers: this.getHeaders(),
    });
    await ensureOk(res, 'approve order');
    return await readJson<Order>(res);
  }

  async rejectOrder(id: string, reason?: string): Promise<Order> {
    const res = await this.request.post(`/api/orders/${id}/reject`, {
      headers: this.getHeaders(),
      data: reason === undefined ? {} : { reason },
    });
    await ensureOk(res, 'reject order');
    return await readJson<Order>(res);
  }
}
