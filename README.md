# 👋 Welcome to my Remix Medusa example repository

The main branch here will have all of the "final" code you need to pull down to see the example. This is being created for a talk on Remix, so I won't dive too deep into the Medusa code. I'm not including the Medusa Admin (https://github.com/medusajs/admin), but it could be included as an app in this monorepo also.

## Step 1: Initialize NX Remix

https://www.npmjs.com/package/@nrwl/remix

Run this command to create a project in a new directory: `npx create-nx-workspace@latest --preset=@nrwl/remix --project=ui-remix`

Add a serve target in your remix app project.json (nested under `"targets"`):

```json
    "serve": {
      "executor": "@nrwl/workspace:run-commands",
      "options": {
        "command": "npm run dev",
        "cwd": "apps/ui-remix"
      }
    }
```

Now you can run `yarn start ui-remix` and the remix app will be running on `localhost:3000`.

## Step 2: Add Medusa CLI & Medusa

Run `yarn add @medusajs/medusa-cli -D -W` to add the CLI to the root of your project.

Run `yarn add @nrwl/node -D -W` to add @nrwl/node to your application.

Run `nx g @nrwl/node:application api-medusa` to initialize a new api-medusa application in your apps directory.

Run `npx medusa new apps/api-medusa-copy --seed` to add initialize a Medusa project to your new api-medusa application.

Delete the `tsconfig.json` in the api-medusa-copy folder. Then copy all of the files over into the `api-medusa` directory, replacing the src directory. Delete the empty api-medusa-copy folder and you should have all the required Medusa files within your `api-medusa` app.

Replace the content of your `api-medusa/project.json` with:

```json
{
  "root": "apps/api-medusa",
  "sourceRoot": "apps/api-medusa/src",
  "projectType": "application",
  "targets": {
    "serve": {
      "executor": "@nrwl/workspace:run-commands",
      "options": {
        "command": "yarn && yarn start",
        "cwd": "apps/api-medusa"
      }
    },
    "build": {
      "executor": "@nrwl/workspace:run-commands",
      "options": {
        "command": "yarn && yarn build",
        "cwd": "apps/api-medusa"
      }
    },
    "seed": {
      "executor": "@nrwl/workspace:run-commands",
      "options": {
        "command": "yarn && yarn seed",
        "cwd": "apps/api-medusa"
      }
    }
  },
  "tags": []
}
```

This maps our Medusa CLI commands for NX. Now we can setup a command to run both of our projects at the same time.

In our root package.json file, we can update our start command to `npx nx run-many --target=serve --all`.

If we have done everything right so far, we should have both our Remix app running on `localhost:3000` and our Medusa API running on `localhost:9000`.

## Step 3: Add a lib for components, set up a product-item, and render a product list

Run `yarn nx generate @nrwl/js:library components --importPath=@demo/components --no-interactive` to create a new component library for our app.

Inside of our new `libs/components/tsconfig.lib.json` file, we'll add `"jsx": "react-jsx",` nested under `"compilerOptions"`. This will allow us to have react components in our library.

In order to utilize Medusa types in our components, we also want to run `yarn add @medusajs/medusa -W` to add Medusa to our root package.json.

Let's create a util folder inside of our `libs/components/src` directory so we can utilize some helper functions for our components, such as our `prices.ts`. This will help us format pricing from Medusa as we build out our components.

```ts
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
```

I like to create index nested index files, so I added a `util/index.ts` that contains:

```ts
export * from './prices';
```

Next in our `libs/components/src/lib` directory we can create a product-item.tsx:

```tsx
import { formatVariantPrice } from '../util';
import type { Product } from '@medusajs/medusa';

export interface ProductListItemContentProps {
  product: Product;
}

export interface ProductListItemProps extends ProductListItemContentProps {
  className?: string;
  renderWrapper?: (
    props: React.PropsWithChildren<{ className?: string }>
  ) => JSX.Element;
}

const ProductListItemContent: React.FC<ProductListItemContentProps> = ({
  product,
}) => {
  // Note: currently variant prices do not come in while searching https://github.com/medusajs/medusa/issues/1484
  const variant = product.variants[0];

  return (
    <div className="group">
      {product.thumbnail && (
        <div className="w-full aspect-w-1 aspect-h-1 border rounded-lg overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full h-full object-center object-cover group-hover:opacity-75"
          />
        </div>
      )}
      <h3 className="mt-4 text-sm text-gray-700">{product.title}</h3>
      {variant.prices && (
        <p className="mt-1 text-lg font-medium text-gray-900">
          {formatVariantPrice(variant)}
        </p>
      )}
    </div>
  );
};

export const ProductListItem: React.FC<ProductListItemProps> = ({
  product,
  renderWrapper: Wrapper,
}) => {
  if (Wrapper)
    return (
      <Wrapper>
        <ProductListItemContent product={product} />
      </Wrapper>
    );

  return <ProductListItemContent product={product} />;
};
```

I also added a `lib/index.ts` that contains:

```ts
export * from './product-item';
```

Now in our `libs/components/src/index.ts` we can export our components and utils like such:

```ts
export * from './lib';
export * from './util';
```

We should have done all we need to set up our component library and our first component. Now we can implement it with Remix and see how we can connect the data.

The easiest way to get data out of Medusa is to use the client.

Run `yarn add @medusajs/medusa-js -W` in our root to install the client.

Now we can add a util function for our client in `libs/components/src/util/medusa-client.ts`:

```ts
import Medusa from '@medusajs/medusa-js';

export const createMedusaClient = () => {
  const BACKEND_URL =
    process.env['PUBLIC_MEDUSA_URL'] || 'http://localhost:9000';
  return new Medusa({ baseUrl: BACKEND_URL, maxRetries: 2 });
};
```

Don't forget to export our new `medusa-client.ts` file from your `util/index.ts` file.

Now let's replace our `our-remix/app/routes/index.ts` content with:

```tsx
import { json, LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
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
```

At this point we get a type error on "Product" when passing in a product to our ProductListItem due to some private properties that Medusa uses. We're still trying to figure out the best way to rectify these, so if anyone has ideas that would be great.

However, we can now run `yarn start` and see an unstyled product list in our browser, which means we have successfully setup our Remix front-end, Medusa API, and utilized the client to get the data and render it on the page. 💯

## Step 4: Setting Up Tailwind

Make sure you have everything we need for Tailwind installed by running `yarn add @nrwl/react tailwindcss @tailwindcss/typography @tailwindcss/forms @tailwindcss/aspect-ratio concurrently -D -W`.

Now cd into `apps/ui-remix` and run `npx tailwindcss init`.

Copy the following content into the new `tailwind.config.js` file that was created:

```ts
const { createGlobPatternsForDependencies } = require('@nrwl/react/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,jsx,js}',
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
```

Create a `ui-remix/app/styles/tailwind.css` file with the following content:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

We'll have to set up some scripts to get tailwind css generating automatically while building and developing. Within your `ui-remix/package.json`, make sure your scripts match the following:

```json
{
  "build": "npm run build:css && npx remix build",
  "build:css": "tailwindcss -m -i ./app/styles/tailwind.css -o app/tailwind.css --config ./tailwind.config.js",
  "dev": "concurrently \"npm run dev:css\" \"npx remix dev\"",
  "dev:css": "tailwindcss -w -i ./app/styles/tailwind.css -o app/tailwind.css --config ./tailwind.config.js",
  "postinstall": "npx remix setup node",
  "start": "npx remix-serve build"
}
```

Let's also add a line with `app/tailwind.css` to our `ui-remix/.gitignore` file so we don't include our generated tailwind output css.

Now all that's left is to import the styles and link the stylesheet in our `ui-remix/app/root.tsx` file:

```ts
import styles from './tailwind.css';

export function links() {
  return [{ rel: 'stylesheet', href: styles }];
}
```

Once the stylesheet is linked, we should be able to see our purged tailwind styles included on our page and a nice product list grid.

## Step 5: Search Input and Postgres

Let's quickly add an Input component to our lib so we can use it for our search.

I don't think we have added classnames to our project yet, but it is very helpful when working with lots of style classes like with Tailwind. We can run `yarn add classnames -W` in our project root to install it.

Add an `input.tsx` to our `libs/components/src/lib` directory:

```tsx
import React from 'react';
import { forwardRef, InputHTMLAttributes } from 'react';
import classNames from 'classnames';

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={classNames(
      'block w-full h-10 px-3 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500',
      className
    )}
  />
));
```

Let's export our new input component from our `lib/index.ts` file by adding the line `export * from './input';`.

We can implement a Remix form by using the useFetcher hook, we'll go through several iterations of our `routes/index.ts` page to see how everything fits together. In this first iteration, we implement an onChange function to update the searchTerm in a queryParam and pass it back to the loader.

```tsx
import { json, LoaderArgs } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { createMedusaClient, Input, ProductListItem } from '@demo/components';

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get('term');

  const client = createMedusaClient();
  const limit = 100;
  const offset = 0;
  const { products, count } = await client.products.list({ q: searchTerm ? `${searchTerm}` : undefined,, limit, offset });
  return json({ products, count, searchTerm });
};

export default function ProductsIndexRoute() {
  const { products, count, searchTerm } = useLoaderData<typeof loader>();
  const productSearch = useFetcher<typeof loader>();

  const submitProductSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window !== undefined) {
      const url = new URL(window.location.href);
      url.searchParams.delete('page');
      if (!event.target.value) url.searchParams.delete('term');
      else url.searchParams.set('term', event.target.value);
      window.history.replaceState({}, '', url.href);
    }
    productSearch.submit(event.target.form);
  };

  return (
    <div className="p-6 xl:p-8">
      <div className="mb-8">
        <productSearch.Form method="get" action="/search?index">
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
```

Unfortunately, this is where we have to switch over from the sqlite database to postgres, because Medusa implements ILIKE in their client for querying which is only a term in postgres.

We can easily setup a local dev environment with Docker.

Now you can delete the `medusa-db.sql`, because we'll be setting up a new database and seeding it separately.

Let's go ahead and change the line with `.env` in our `api-medusa/.gitignore` file to `.env.*` so we can commit our env with these local development environment variables.

Now you can update the `api-medusa/.env` to:

```
PUBLIC_MEDUSA_URL="http://localhost:9000"
MEDUSA_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/demo"
MEDUSA_REDIS_URL="redis://:password@localhost:6379"
```

Make sure the `DATABASE_URL` in your `medusa-config.js` is set to equal `process.env.MEDUSA_DATABASE_URL`.

Inside of your project root, create a `docker-compose.yml` file with:

```yml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    image: backend:starter
    container_name: medusa-server-default
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgres://postgres:postgres@postgres:5432/medusa-docker
      REDIS_URL: redis://redis
      NODE_ENV: development
      JWT_SECRET: something
      COOKIE_SECRET: something
      PORT: 9000
    ports:
      - '9000:9000'
    volumes:
      - .:/app/medusa
      - node_modules:/app/medusa/node_modules

  postgres:
    image: postgres:10.4
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: medusa-docker

  redis:
    image: redis
    expose:
      - 6379

volumes:
  node_modules:
```

We also have a script to initialize a database within your postgres image. Also in root, create a `dev` folder and inside add a `postgres-init.sh` file with:

```sh
#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "postgres" --dbname "postgres" <<-EOSQL
    CREATE DATABASE "demo";
EOSQL
```

We can update our `module.exports` in our `medusa-config.js` file to:

```js
module.exports = {
  projectConfig: {
    redis_url: REDIS_URL,
    database_url: DATABASE_URL,
    database_type: 'postgres',
    store_cors: STORE_CORS,
    admin_cors: ADMIN_CORS,
  },
  plugins,
};
```

Here are scripts that we use for `medusa-api/package.json`:

```json
{
  "seed": "medusa seed -f ./data/seed.json",
  "build": "rm -rf dist && ./node_modules/.bin/tsc -p tsconfig.json",
  "build-local": "rm -rf dist && ./node_modules/.bin/tsc -p tsconfig.dev.json",
  "start": "medusa develop",
  "migrate": "yarn medusa:migrate && yarn medex:migrate",
  "medusa:migrate": "medusa migrations run",
  "medex:migrate": "medex migrate --run",
  "seed:prod": "node src/seed.js",
  "start:prod": "node src/main.js"
}
```

Finally, in our root `package.json`, here are some helpful scripts for setting up and running the project:

```json
{
  "nukedb": "docker compose down -v && yarn compose",
  "first-init": "yarn setup && yarn seed && yarn develop",
  "setup": "yarn && yarn compose && nx run api-medusa:migrate",
  "seed": "nx run api-medusa:seed",
  "compose": "docker compose up -d",
  "develop": "yarn setup && yarn start",
  "start": "npx nx run-many --target=serve --all",
  "build": "nx build",
  "test": "nx test",
  "postinstall": "remix setup node",
  "clean": "npx nx run-many --target=clean --all && find . -name \"node_modules\" -type d -prune -exec rm -rf '{}' + && yarn"
}
```

Now if you run `yarn first-init`, you should get a docker environment setup with the data seeded. Once that is run, on subsequent times you can just run `yarn start`.

If you get an error running `yarn first-init`, you might need to run `yarn nukedb` and ``chmod +x dev/postgres-init.sh`, then try again.

## Step 6: Optimizing Our Search

Currently when typing in our search input, a page refresh is required before the search works. We can utilize a `useEffect` to update the page data with the information returned from the loader. Notice the `action="/?index"` on the form is how Remix knows that we are targeting our index file to refetch data with our get form submission.

```tsx
import { json, LoaderArgs } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { createMedusaClient, Input, ProductListItem } from '@demo/components';
import { useState } from 'react';
import { useEffect } from 'react';

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
  const pageData = useLoaderData<typeof loader>();
  const productSearch = useFetcher();
  const [data, setData] = useState(pageData);

  const submitProductSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window !== undefined) {
      const url = new URL(window.location.href);
      if (!event.target.value) url.searchParams.delete('term');
      else url.searchParams.set('term', event.target.value);
      window.history.replaceState({}, '', url.href);
    }
    productSearch.submit(event.target.form);
  };

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

      <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {data.products.map((product) => (
          <ProductListItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

This works pretty well, but it runs a lot of requests when typing. Debouncing the function is an easy way to optimize searches and have them feel a little more natural.

Run `yarn add use-debounce -W` to add use-debounce to the project and then we can utilize the useDebouncedCallback function like:

```tsx
import { json, LoaderArgs } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { createMedusaClient, Input, ProductListItem } from '@demo/components';
import { useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';

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
  const pageData = useLoaderData<typeof loader>();
  const productSearch = useFetcher();
  const [data, setData] = useState(pageData);

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

      <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {data.products.map((product) => (
          <ProductListItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

At this point in the setup, I was getting a React Hooks error with multiple versions or React installed and then some random error with Babel compilation.

NX likes to have all of your dependencies install in the root and works pretty well with yarn workspaces. I also noticed that `apps/*` wasn't defined in the workspaces for our root package.json.

Project root `package.json`:

```json
{
  "name": "demo",
  "version": "0.0.0",
  "license": "MIT",
  "scripts": {
    "nukedb": "docker compose down -v && yarn compose",
    "first-init": "yarn setup && yarn seed && yarn develop",
    "setup": "yarn && yarn compose && nx run api-medusa:migrate",
    "seed": "nx run api-medusa:seed",
    "compose": "docker compose up -d ",
    "develop": "yarn setup && yarn start",
    "start": "npx nx run-many --target=serve --all",
    "build": "nx build",
    "test": "nx test",
    "postinstall": "remix setup node",
    "clean": "npx nx run-many --target=clean --all && find . -name \"node_modules\" -type d -prune -exec rm -rf '{}' + && yarn"
  },
  "private": true,
  "dependencies": {
    "@medusajs/medusa-js": "^1.2.3",
    "@medusajs/medusa": "^1.3.4",
    "@nrwl/remix": "14.4.2",
    "@remix-run/react": "^1.0.6",
    "@remix-run/serve": "^1.0.6",
    "classnames": "^2.3.1",
    "medusa-interfaces": "^1.3.1",
    "medusa-payment-manual": "^1.0.16",
    "medusa-payment-stripe": "^1.1.41",
    "react-dom": "^17.0.2",
    "react": "^17.0.2",
    "remix": "^1.0.6",
    "tslib": "^2.3.0",
    "typeorm": "^0.2.36",
    "use-debounce": "^8.0.3"
  },
  "devDependencies": {
    "@babel/cli": "^7.14.3",
    "@babel/core": "^7.14.3",
    "@babel/preset-typescript": "^7.18.6",
    "@medusajs/medusa-cli": "^1.3.1",
    "@nrwl/cli": "14.4.3",
    "@nrwl/eslint-plugin-nx": "14.4.3",
    "@nrwl/jest": "14.4.3",
    "@nrwl/linter": "14.4.3",
    "@nrwl/node": "^14.4.3",
    "@nrwl/react": "^14.4.3",
    "@nrwl/workspace": "14.4.3",
    "@remix-run/dev": "^1.0.6",
    "@tailwindcss/aspect-ratio": "^0.4.0",
    "@tailwindcss/forms": "^0.5.2",
    "@tailwindcss/typography": "^0.5.4",
    "@types/jest": "27.4.1",
    "@types/node": "16.11.7",
    "@types/react-dom": "^17.0.9",
    "@types/react": "^17.0.24",
    "@typescript-eslint/eslint-plugin": "^5.29.0",
    "@typescript-eslint/parser": "^5.29.0",
    "babel-preset-medusa-package": "^1.1.19",
    "concurrently": "^7.3.0",
    "eslint-config-prettier": "8.1.0",
    "eslint": "~8.15.0",
    "jest": "27.5.1",
    "nx": "14.4.3",
    "prettier": "^2.6.2",
    "tailwindcss": "^3.1.6",
    "ts-jest": "27.1.4",
    "ts-node": "~10.8.0",
    "typescript": "~4.7.2"
  },
  "workspaces": ["apps/*", "libs/*"]
}
```

`api-medusa/package.json`:

```json
{
  "name": "medusa-starter-default",
  "version": "0.0.1",
  "description": "A starter for Medusa projects.",
  "author": "Sebastian Rindom <skrindom@gmail.com>",
  "license": "MIT",
  "scripts": {
    "seed": "medusa seed -f ./data/seed.json",
    "build": "rm -rf dist && ./node_modules/.bin/tsc -p tsconfig.json",
    "build-local": "rm -rf dist && ./node_modules/.bin/tsc -p tsconfig.dev.json",
    "start": "medusa develop",
    "migrate": "yarn medusa:migrate && yarn medex:migrate",
    "medusa:migrate": "medusa migrations run",
    "medex:migrate": "medex migrate --run",
    "seed:prod": "node src/seed.js",
    "start:prod": "node src/main.js"
  },
  "dependencies": {
    "@medusajs/medusa": "*",
    "medusa-fulfillment-manual": "*",
    "medusa-interfaces": "*",
    "medusa-payment-manual": "*",
    "medusa-payment-stripe": "*",
    "typeorm": "*"
  },
  "repository": "https://github.com/medusajs/medusa-starter-default.git",
  "keywords": ["sqlite", "ecommerce", "headless", "medusa"],
  "devDependencies": {
    "@babel/cli": "*",
    "@babel/core": "*",
    "@babel/preset-typescript": "*",
    "@medusajs/medusa-cli": "*",
    "babel-preset-medusa-package": "*"
  }
}
```

`ui-remix/package.json`:

```json
{
  "private": true,
  "name": "ui-remix",
  "description": "",
  "license": "",
  "scripts": {
    "build": "npm run build:css && npx remix build",
    "build:css": "tailwindcss -m -i ./app/styles/tailwind.css -o app/tailwind.css --config ./tailwind.config.js",
    "dev": "concurrently \"npm run dev:css\" \"npx remix dev\"",
    "dev:css": "tailwindcss -w -i ./app/styles/tailwind.css -o app/tailwind.css --config ./tailwind.config.js",
    "postinstall": "npx remix setup node",
    "start": "npx remix-serve build"
  },
  "dependencies": {
    "@remix-run/react": "*",
    "@remix-run/serve": "*",
    "react": "*",
    "react-dom": "*",
    "remix": "*"
  },
  "devDependencies": {
    "@remix-run/dev": "*",
    "@types/react": "*",
    "@types/react-dom": "*",
    "typescript": "*"
  },
  "engines": {
    "node": ">=14"
  },
  "sideEffects": false
}
```

Notice how all of the child `package.json` packages can use "\*" to point to the same version as the root `package.json`. You can override versions if needed in rare circumstances, but this is very helpful when you want everything to use the same versions of packages.

In the root, you can run `yarn clean` to clear out all node_modules and run a fresh install.

After refactoring, we should be able to run `yarn start` and get everything running smoothly again. Notice our search is debouncing properly and the search works and feels great.

# NX Readme

This project was generated using [Nx](https://nx.dev).

<p style="text-align: center;"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="450"></p>

🔎 **Smart, Fast and Extensible Build System**

## Adding capabilities to your workspace

Nx supports many plugins which add capabilities for developing different types of applications and different tools.

These capabilities include generating applications, libraries, etc as well as the devtools to test, and build projects as well.

Below are our core plugins:

- [React](https://reactjs.org)
  - `npm install --save-dev @nrwl/react`
- Web (no framework frontends)
  - `npm install --save-dev @nrwl/web`
- [Angular](https://angular.io)
  - `npm install --save-dev @nrwl/angular`
- [Nest](https://nestjs.com)
  - `npm install --save-dev @nrwl/nest`
- [Express](https://expressjs.com)
  - `npm install --save-dev @nrwl/express`
- [Node](https://nodejs.org)
  - `npm install --save-dev @nrwl/node`

There are also many [community plugins](https://nx.dev/community) you could add.

## Generate an application

Run `nx g @nrwl/react:app my-app` to generate an application.

> You can use any of the plugins above to generate applications as well.

When using Nx, you can create multiple applications and libraries in the same workspace.

## Generate a library

Run `nx g @nrwl/react:lib my-lib` to generate a library.

> You can also use any of the plugins above to generate libraries as well.

Libraries are shareable across libraries and applications. They can be imported from `@demo/mylib`.

## Development server

Run `nx serve my-app` for a dev server. Navigate to http://localhost:4200/. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `nx g @nrwl/react:component my-component --project=my-app` to generate a new component.

## Build

Run `nx build my-app` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `nx test my-app` to execute the unit tests via [Jest](https://jestjs.io).

Run `nx affected:test` to execute the unit tests affected by a change.

## Running end-to-end tests

Run `nx e2e my-app` to execute the end-to-end tests via [Cypress](https://www.cypress.io).

Run `nx affected:e2e` to execute the end-to-end tests affected by a change.

## Understand your workspace

Run `nx graph` to see a diagram of the dependencies of your projects.

## Further help

Visit the [Nx Documentation](https://nx.dev) to learn more.

## ☁ Nx Cloud

### Distributed Computation Caching & Distributed Task Execution

<p style="text-align: center;"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-cloud-card.png"></p>

Nx Cloud pairs with Nx in order to enable you to build and test code more rapidly, by up to 10 times. Even teams that are new to Nx can connect to Nx Cloud and start saving time instantly.

Teams using Nx gain the advantage of building full-stack applications with their preferred framework alongside Nx’s advanced code generation and project dependency graph, plus a unified experience for both frontend and backend developers.

Visit [Nx Cloud](https://nx.app/) to learn more.
