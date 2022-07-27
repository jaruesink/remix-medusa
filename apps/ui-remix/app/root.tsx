import { json } from '@remix-run/node';
import type { MetaFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import { LoaderArgs } from 'remix';
import { createMedusaClient } from '@demo/components';
import { cartIdCookie, fetchOrCreateCart } from './cart.server';
import styles from './tailwind.css';
import { createContext } from 'react';
import { Cart } from '@medusajs/medusa';

export function links() {
  return [{ rel: 'stylesheet', href: styles }];
}

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'New Remix App',
  viewport: 'width=device-width,initial-scale=1',
});

export const loader = async ({ request }: LoaderArgs) => {
  const medusa = createMedusaClient();
  const cookieHeader = request.headers.get('Cookie');
  const cartId = await cartIdCookie.parse(cookieHeader);
  const cart = await fetchOrCreateCart(cartId, medusa);
  const headers = new Headers();
  if (cart?.id && cart?.id !== cartId)
    headers.set('Set-Cookie', await cartIdCookie.serialize(cart.id));
  return json({ cart }, { headers });
};

export const cartContext = createContext<Cart | null>(null);

export default function App() {
  const { cart } = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <cartContext.Provider value={cart}>
          <Outlet />
        </cartContext.Provider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
