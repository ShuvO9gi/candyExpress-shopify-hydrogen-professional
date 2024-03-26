import {json, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import infoIcon from '../../public/icon_info.svg';
import leftArrow from '../../public/left_arrow.svg';
import rightArrow from '../../public/right_arrow.svg';
import {useEffect, useRef, useState} from 'react';

import type {
  Category,
  MenuItems,
  TopMenu,
  VerticalMenu,
} from '~/dtos/collections.dto';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
};

export async function loader({request, params, context}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 200,
  });

  if (!handle) {
    return redirect('/collections');
  }

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle, ...paginationVariables},
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }
  return json({collection});
}

export default function Collection() {
  // return '';
  const {collection} = useLoaderData<typeof loader>();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchMenuItemsData = async () => {
      try {
        const menuItems: MenuItems = await fetchMenuItems();
        if (menuItems) {
          setCategories(
            menuItems.data.vertical_menu.map((item: VerticalMenu) => {
              return {
                display_name: item.display_name,
                tag_name: item.tag_name,
              };
            }),
          );
        } else {
          console.log('Failed to fetch menu items');
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };

    fetchMenuItemsData();
  }, []);

  return (
    <div>
      <ProductsGrid
        products={collection.products.nodes}
        categories={categories}
      />
    </div>
  );
}

async function fetchMenuItems(): Promise<MenuItems> {
  try {
    const response: any = await fetch(
      'https://staging.candyexpress.com/api/v1/menu-item',
    );

    if (!response.ok) {
      throw new Error('Failed to fetch menu items');
    }

    const menuItems: Promise<MenuItems> = await response.json();
    return menuItems;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return {} as any; // Fix: Return an empty object instead of an empty array
  }
}

function ProductsGrid({
  products,
  categories,
}: {
  products: ProductItemFragment[];
  categories: Category[];
}) {
  const containerRefs = useRef<Array<HTMLDivElement | null>>(
    Array(categories.length).fill(null),
  );

  const touchStartX = useRef<number>(0);

  const handleSwipe = (direction: 'left' | 'right', index: number) => {
    if (!containerRefs.current[index]) return;

    const container = containerRefs.current[index];
    const scrollAmount = direction === 'left' ? -300 : 300;
    container!.scrollLeft += scrollAmount;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (
    index: number,
    e: React.TouchEvent<HTMLDivElement>,
  ) => {
    const container = containerRefs.current[index];
    const touchEndX = e.touches[0].clientX;
    const difference = touchStartX.current - touchEndX;

    if (Math.abs(difference) > 50) {
      const direction = difference > 0 ? 'right' : 'left';
      handleSwipe(direction, index);
    }
  };

  return (
    <div>
      {categories.map((category, index) => {
        const filteredProducts = products.filter((product) =>
          product.tags.includes(category.tag_name),
        );

        if (!filteredProducts.length) return null;

        return (
          <div key={category.tag_name}>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold">{category.display_name}</h1>
              <div className="flex">
                <button onClick={() => handleSwipe('left', index)}>
                  <img src={leftArrow} alt="Left" className="mr-2 w-8 h-8" />
                </button>
                <button onClick={() => handleSwipe('right', index)}>
                  <img src={rightArrow} alt="Right" className="w-8 h-8" />
                </button>
              </div>
            </div>

            <div
              ref={(ref) => (containerRefs.current[index] = ref)}
              className="slider-container"
              onTouchStart={handleTouchStart}
              onTouchMove={(e) => handleTouchMove(index, e)}
              style={{
                display: 'flex',
                overflowX: 'hidden',
                whiteSpace: 'nowrap',
                scrollBehavior: 'smooth',
              }}
            >
              {filteredProducts.map((product, idx) => (
                <div key={`${product.id}-${idx}`} style={{marginRight: '10px'}}>
                  <ProductItem product={product} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProductItem({
  product,
  loading,
}: {
  product: ProductItemFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);

  return (
    <div className="flex justify-center w-[246px] h-[310px]">
      <Link
        className="flex flex-col items-center product-item"
        key={product.id}
        prefetch="intent"
        to={variantUrl}
      >
        <div className="mt-0.5 w-[186px] h-[186px] relative">
          <img
            className="[&&]:w-[20px] [&&]:h-[20px] mt-[-2px] ml-[170px] absolute"
            src={infoIcon}
            alt="image_import"
          />

          {product.featuredImage && (
            <Image
              alt={product.featuredImage.altText || product.title}
              aspectRatio="1/1"
              data={product.featuredImage}
              loading={loading}
              sizes="(min-width: 45em) 400px, 100vw"
              className="p-2"
            />
          )}
        </div>
        <div className="bg-[#D3B5D1]/[0.2] rounded-[14px] w-[246px] h-[212px] mt-[-98px] -z-10 flex flex-col items-center">
          <h4 className="mt-[90px] font-bold text-[18px]">{product.title}</h4>

          <small className="font-semibold text-[14px] text-[#9C6EAA]">
            <Money data={product.priceRange.minVariantPrice} />
          </small>
          <button className="w-[206px] h-[50px] rounded-full border-0 bg-[#FFAD05] mt-[10px] mb-[20px] font-bold text-xl text-white tracking-wide">
            PUT I KURV
          </button>
        </div>
      </Link>
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    tags
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        selectedOptions {
          name
          value
        }
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
