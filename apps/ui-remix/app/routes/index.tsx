import { json, LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { StoreProductsListRes } from '@medusajs/medusa';
import { createMedusaClient, ProductListItem } from '@demo/components';

export const loader = async (args: LoaderArgs) => {
  const client = createMedusaClient();
  const limit = 100;
  const offset = 0;
  const { products, count } = await client.products.list({ limit, offset });
  return json({ products, count });
};

export default function ProductsIndexRoute() {
  const { products, count } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 xl:p-8">
      <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {products.map((product) => (
          <ProductListItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
