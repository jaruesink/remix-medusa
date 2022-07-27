import { json, LoaderArgs } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { createMedusaClient, Input, ProductListItem } from '@demo/components';

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

export default function ProductsIndexRoute() {
  const { products, count, searchTerm } = useLoaderData<typeof loader>();
  const productSearch = useFetcher<typeof loader>();

  const submitProductSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window !== undefined) {
      const url = new URL(window.location.href);
      if (!event.target.value) url.searchParams.delete('term');
      else url.searchParams.set('term', event.target.value);
      window.history.replaceState({}, '', url.href);
    }
    productSearch.submit(event.target.form);
  };

  return (
    <div className="p-6 xl:p-8">
      <div className="mb-8">
        <productSearch.Form method="get" action="/">
          <Input
            autoComplete="off"
            type="text"
            name="term"
            value={undefined}
            onChange={submitProductSearch}
            defaultValue={searchTerm || ''}
            placeholder="Search products..."
          />
        </productSearch.Form>
      </div>

      <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {products.map((product) => (
          <ProductListItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
