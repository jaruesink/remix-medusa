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

## Step 3: Add a lib for components and set up a product-item

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

## Step 4: Getting data from the Medusa Client

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
```

At this point we get a type error on "Product" when passing in a product to our ProductListItem due to some private properties that Medusa uses. We're still trying to figure out the best way to rectify these, so if anyone has ideas that would be great.

However, we can now run `yarn start` and see an unstyled product list in our browser, which means we have successfully setup our Remix front-end, Medusa API, and utilized the client to get the data and render it on the page. 💯

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
