import { StoreCartsRes } from '@medusajs/medusa';
import Medusa from '@medusajs/medusa-js';
import { createCookie } from 'remix';

export const fetchOrCreateCart: (
  cartId: string,
  medusa: Medusa
) => Promise<StoreCartsRes['cart']> = async (cartId, medusa) => {
  if (!cartId) return (await medusa.carts.create({})).cart;

  let cart;
  try {
    const response = await medusa.carts.retrieve(cartId);
    cart = response.cart;
  } catch (e) {
    // no cart with that id.
  }
  return cart ? cart : (await medusa.carts.create({})).cart;
};

export const cartIdCookie = createCookie('cart-id', {
  maxAge: 604_800, // one week
});
