import { json, LoaderArgs } from '@remix-run/node';
import { Form, useFetcher, useLoaderData } from '@remix-run/react';
import { createMedusaClient, Input, ProductListItem } from '@demo/components';
import { useState, useEffect, useContext } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { cartContext } from '~/root';
import { ActionArgs } from 'remix';

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get('term');

  const client = createMedusaClient();
  const limit = 100;
  const offset = 0;

  const { products, count } = await client.products.list({
    q: searchTerm ? `${searchTerm}` : undefined,
    limit,
    offset,
  });
  return json({ products, count, searchTerm });
};

export async function action({ request }: ActionArgs) {
  const client = createMedusaClient();
  const formData = await request.formData();
  const cartId = formData.get('cartId') as string;
  const productId = formData.get('productId') as string;
  const { product } = await client.products.retrieve(productId || '');

  const { cart } = await client.carts.lineItems.create(cartId, {
    variant_id: product.variants[0].id,
    quantity: 1,
  });

  return json(cart);
}

export default function ProductsIndexRoute() {
  const pageData = useLoaderData<typeof loader>();
  const productSearch = useFetcher();
  const addProductToCart = useFetcher();
  const [data, setData] = useState(pageData);
  const cart = useContext(cartContext);

  const submitProductSearch = useDebouncedCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (typeof window !== undefined) {
        const url = new URL(window.location.href);
        if (!event.target.value) url.searchParams.delete('term');
        else url.searchParams.set('term', event.target.value);
        window.history.replaceState({}, '', url.href);
      }
      productSearch.submit(event.target.form);
    },
    200,
    { leading: true }
  );

  useEffect(() => {
    if (productSearch?.data) setData(productSearch.data);
  }, [productSearch]);

  return (
    <div className="p-6 xl:p-8">
      <div className="mb-8">
        <productSearch.Form method="get" action="/?index">
          <Input
            autoComplete="off"
            type="text"
            name="term"
            value={undefined}
            onChange={submitProductSearch}
            defaultValue={data.searchTerm || ''}
            placeholder="Search products..."
          />
        </productSearch.Form>
      </div>

      <p>
        Items in cart:{' '}
        {cart?.items.reduce((acc, item) => acc + item.quantity, 0)}
      </p>

      <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {data.products.map((product) => (
          <addProductToCart.Form
            key={product.id}
            method="post"
            action="/?index"
          >
            <ProductListItem product={product} />
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="cartId" value={cart?.id} />
            <button
              className="w-full bg-indigo-600 border border-transparent rounded-md py-3 mt-2 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              type="submit"
            >
              Add to cart
            </button>
          </addProductToCart.Form>
        ))}
      </div>
    </div>
  );
}
