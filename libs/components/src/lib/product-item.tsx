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
