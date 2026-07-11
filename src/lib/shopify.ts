import { optional, required } from '@/lib/env';
import type { Purchase } from '@/lib/types';

/**
 * Shopify Admin API (GraphQL) client.
 * Custom-app scopes needed: read_customers, read_orders, write_discounts.
 * All calls are server-side; the access token never reaches the client.
 */

const API_VERSION = '2024-10';

async function adminGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const shop = required('SHOPIFY_SHOP_DOMAIN'); // e.g. run-store.myshopify.com
  const res = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': required('SHOPIFY_ADMIN_ACCESS_TOKEN'),
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify Admin API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`Shopify GraphQL: ${JSON.stringify(json.errors)}`);
  return json.data as T;
}

/** Find the Shopify customer id for a verified email (exact match). */
export async function findCustomerByEmail(email: string): Promise<string | null> {
  const data = await adminGraphql<{
    customers: { nodes: { id: string; email: string | null }[] };
  }>(
    `query ($q: String!) { customers(first: 5, query: $q) { nodes { id email } } }`,
    { q: `email:${JSON.stringify(email)}` }
  );
  const match = data.customers.nodes.find(
    (c) => c.email?.toLowerCase() === email.toLowerCase()
  );
  return match?.id ?? null;
}

const SHOE_HINTS = ['shoe', 'sneaker', 'trainer', 'footwear'];

export async function fetchOrdersForCustomer(shopifyCustomerGid: string): Promise<Purchase[]> {
  const numericId = shopifyCustomerGid.split('/').pop();
  const data = await adminGraphql<{
    orders: {
      nodes: {
        id: string;
        name: string;
        processedAt: string;
        currentTotalPriceSet: { shopMoney: { amount: string } };
        lineItems: {
          nodes: {
            title: string;
            quantity: number;
            product: { productType: string | null } | null;
          }[];
        };
      }[];
    };
  }>(
    `query ($q: String!) {
      orders(first: 50, query: $q, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id name processedAt
          currentTotalPriceSet { shopMoney { amount } }
          lineItems(first: 20) { nodes { title quantity product { productType } } }
        }
      }
    }`,
    { q: `customer_id:${numericId}` }
  );
  return data.orders.nodes.map((o) => ({
    id: o.id,
    orderNumber: o.name,
    processedAt: o.processedAt,
    totalRands: parseFloat(o.currentTotalPriceSet.shopMoney.amount),
    items: o.lineItems.nodes.map((li) => {
      const type = (li.product?.productType ?? '').toLowerCase();
      const title = li.title.toLowerCase();
      return {
        title: li.title,
        quantity: li.quantity,
        isShoe: SHOE_HINTS.some((h) => type.includes(h) || title.includes(h)),
      };
    }),
  }));
}

export interface IssuedDiscount {
  code: string;
  gid: string;
  endsAt: string;
}

function randomCode(prefix: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity at the till
  let s = '';
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}-${s}`;
}

/**
 * Create a unique single-use discount code. Caller handles failures by
 * refunding the ledger (see redeemReward in actions/rewards.ts).
 */
export async function createSingleUseDiscount(opts: {
  kind: 'discount_amount' | 'discount_percent';
  valueRands: number;
  expiryDays: number;
  shopifyCustomerGid: string | null;
}): Promise<IssuedDiscount> {
  const code = randomCode('RUN');
  const endsAt = new Date(Date.now() + opts.expiryDays * 86400000).toISOString();
  const customerSelection = opts.shopifyCustomerGid
    ? { customers: { add: [opts.shopifyCustomerGid] } }
    : { all: true };
  const value =
    opts.kind === 'discount_amount'
      ? { discountAmount: { amount: opts.valueRands.toFixed(2), appliesOnEachItem: false } }
      : { percentage: opts.valueRands / 100 };

  const data = await adminGraphql<{
    discountCodeBasicCreate: {
      codeDiscountNode: { id: string } | null;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(
    `mutation ($discount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $discount) {
        codeDiscountNode { id }
        userErrors { field message }
      }
    }`,
    {
      discount: {
        title: `RUN Rewards ${code}`,
        code,
        startsAt: new Date().toISOString(),
        endsAt,
        usageLimit: 1,
        appliesOncePerCustomer: true,
        customerSelection,
        customerGets: { value, items: { all: true } },
      },
    }
  );

  const result = data.discountCodeBasicCreate;
  if (!result.codeDiscountNode || result.userErrors.length) {
    throw new Error(
      `discountCodeBasicCreate failed: ${result.userErrors.map((e) => e.message).join('; ') || 'no node returned'}`
    );
  }
  return { code, gid: result.codeDiscountNode.id, endsAt };
}

export function shopifyConfigured(): boolean {
  return Boolean(optional('SHOPIFY_SHOP_DOMAIN') && optional('SHOPIFY_ADMIN_ACCESS_TOKEN'));
}
