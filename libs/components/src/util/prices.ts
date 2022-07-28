import { Cart, LineItem } from '@medusajs/medusa';
import { merge } from 'lodash';

// TODO: Detect user language
const locale = 'en-US';

// TODO: Detect user currency/Allow currency selection (usd | eur)
const regionCurrency = 'usd';

export interface FormatPriceOptions {
  currency?: Intl.NumberFormatOptions['currency'];
  quantity?: number;
}

export function formatPrice(
  amount?: number | null,
  options?: FormatPriceOptions
) {
  const defaultOptions = {
    currency: regionCurrency,
    quantity: 1,
  };
  const { currency, quantity } = merge({}, defaultOptions, options);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(((amount || 0) / 100) * quantity);
}

export function formatVariantPrice(variant: any) {
  const price = variant.prices.find(
    (price: any) => price.currency_code == regionCurrency
  );

  if (!price) return null;

  return formatPrice(price.amount);
}

export function formatLineItemPrice(lineItem: LineItem) {
  return formatPrice(lineItem.unit_price, { quantity: lineItem.quantity });
}

export function formatCartSubtotal(cart: Cart) {
  if (!cart.subtotal) return null;

  return formatPrice(cart.subtotal);
}
