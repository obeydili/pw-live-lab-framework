import { request, expect } from '@playwright/test';
import { env } from '../../../helpers/env';
import type { Order } from '../../../types/order';
import { isSortedDescending } from '../../../helpers/orders-assert';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';

async function main() {
  const api = await request.newContext({ baseURL: BASE_URL });
  try {
    const resetResponse = await api.post('/api/test/reset');
    const resetJson = await resetResponse.json();
    const seedTotal = resetJson.orders;
    const loginResponse = await api.post('/api/auth/login', {
      data: {
        username: 'trader1',
        password: env.TRADER1_PASSWORD,
      },
    });
    const jsonLogin = await loginResponse.json();
    const token = jsonLogin.token;
    const getOrders1 = await api.get('api/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        status: 'Rejected',
      },
    });
    const orders1: Order[] = await getOrders1.json();
    expect(orders1.every((order) => order.status === 'Rejected')).toBe(true);

    const getOrders2 = await api.get('api/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        symbol: 'ACME',
      },
    });

    const orders2: Order[] = await getOrders2.json();
    expect(orders2.every((order) => order.symbol === 'ACME')).toBe(true);

    const getOrders3 = await api.get('api/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        side: 'Buy',
      },
    });

    const orders3: Order[] = await getOrders3.json();
    expect(orders3.every((order) => order.side === 'Buy')).toBe(true);

    const getOrders4 = await api.get('api/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        symbol: 'ACME',
        side: 'Buy',
        sort: '-limitPrice',
      },
    });

    const orders4: Order[] = await getOrders4.json();
    expect(orders4.every((order) => order.symbol === 'ACME')).toBe(true);
    expect(orders4.every((order) => order.side === 'Buy')).toBe(true);

    /**
    for (let i = 1; i < orders4.length; i++) {
      const currentPrice = orders4[i].limitPrice;
      const previousPrice = orders4[i - 1].limitPrice;
      expect(previousPrice).toBeGreaterThanOrEqual(currentPrice);
    }
    **/

    const prices = orders4.map(order => order.limitPrice);
    expect(isSortedDescending(prices)).toBe(true);
    
    
    const getOrders5 = await api.get('api/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        q: ' acme ',
      },
    });

    const orders5: Order[] = await getOrders5.json();
    expect(orders5.every((order) => order.symbol === 'ACME')).toBe(true);

    const getOrders6 = await api.get('api/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        createdBy: 'trader2',
      },
    });

    const orders6: Order[] = await getOrders6.json();
    expect(orders6.every((order) => order.createdBy === 'trader2')).toBe(true);

    const getOrders7 = await api.get('api/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        page: 3,
        pageSize: 10,
      },
    });

    const orders7headers = getOrders7.headers();
    expect(orders7headers['x-total-count']).toBe(String(seedTotal));
    expect(orders7headers['x-total-pages']).toBe(String(Math.ceil(seedTotal / 10)));
    const orders7 = await getOrders7.json();
    expect(orders7.length).toBe(seedTotal - 20);

    let currentPageNumber = 1;
    const array: Order[][] = [];
    // Starts non-empty so the loop runs once; replaced by each page of results.
    let orders8: unknown[] = [{ start: 'start' }];

    while (orders8.length > 0) {
      const getOrders8 = await api.get('api/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPageNumber,
          pageSize: 7,
          sort: 'id',
        },
      });
      const pageOfOrders: Order[] = await getOrders8.json();
      orders8 = pageOfOrders;
      array.push(pageOfOrders);
      currentPageNumber++;
    }

    /**
    const ids: string[] = [];
    for (let number = 0; number < array.length; number++) {
      for (let number2 = 0; number2 < array[number].length; number2++) {
        ids.push(array[number][number2].id);
      }
    }
    **/

    const ids = array.flat().map(order => order.id)

    expect(ids.length).toBe(seedTotal);
    const setOfIds = new Set(ids);
    expect(setOfIds.size).toBe(ids.length);

    for (let i = 1; i < ids.length; i++) {
      //const currentOrderNumber = parseFloat(ids[i].replace('ORD-', ''));
      //const previousOrderNumber = parseFloat(ids[i - 1].replace('ORD-', ''));
      //expect(currentOrderNumber).toBeGreaterThanOrEqual(previousOrderNumber);
      expect(ids[i] >= ids[i - 1]).toBeTruthy();
    }

    // TODO: reset response gives the seed total
    // TODO: symbol=ACME&side=Buy&sort=-limitPrice: all match, prices descending
    // TODO: status, createdBy=trader2 and q='  acme ' filters
    // TODO: page 3 size: total - 20; X-Total-Count / X-Total-Pages
    // TODO: walk pageSize 7 with sort=id: unique, sorted, total matches
    // TODO: page 99 -> []; 400 for pageSize 0, page abc, sort price, side Hold, symbol XYZ
    const getOrders9 = await api.get('api/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        page: 99,
      },
    });

    const orders9 = await getOrders9.json();
    expect(orders9.length).toBe(0);
    expect(getOrders9.status()).toBe(200);

    const getOrders10 = await api.get('api/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        pageSize: 0,
        page: 'abc',
        sort: 'price',
        side: 'Hold',
        symbol: 'XYZ',
      },
    });

    expect(getOrders10.status()).toBe(400);

    console.log('PASS: TODO');
  } finally {
    await api.dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
