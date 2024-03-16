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
import {useEffect, useState} from 'react';

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
    <div className="collection collection-custom">
      <Pagination connection={collection.products}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <>
            <ProductsGrid products={nodes} categories={categories} />
          </>
        )}
      </Pagination>
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
  const [scrollPositions, setScrollPositions] = useState<Array<number>>(
    Array(categories.length).fill(0),
  );
  const [windowWidth, setWindowWidth] = useState(() => {
    // Initialize windowWidth with the actual window width if available,
    // Otherwise, default to 0
    return typeof window !== 'undefined' ? window.innerWidth : 0;
  });

  useEffect(() => {
    // Check if window is defined (i.e., we are in the browser environment)
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  const handleScroll = (index: number, direction: 'left' | 'right') => {
    // Check if window is defined (i.e., we are in the browser environment)
    if (typeof window !== 'undefined') {
      const scrollContainer = document.getElementById(
        `slider-container-${index}`,
      );
      if (!scrollContainer) return;

      // Calculate the scroll amount based on the width of 5 products
      const scrollAmount =
        direction === 'left' ? -5 * windowWidth : 5 * windowWidth;

      // Apply smooth scrolling animation
      scrollContainer.style.transition = 'transform 0.5s ease-in-out';
      scrollContainer.scrollLeft += scrollAmount;

      // Update scroll position after animation completes
      setTimeout(() => {
        setScrollPositions((prevScrollPositions) => {
          const updatedPositions = [...prevScrollPositions];
          updatedPositions[index] = scrollContainer.scrollLeft;
          return updatedPositions;
        });

        // Remove transition to avoid affecting subsequent scrolls
        scrollContainer.style.transition = 'none';
      }, 500);
    }
  };

  return (
    <div>
      {categories.map((category, index) => {
        const filteredProducts = products.filter((product) =>
          product.tags.includes(category.tag_name),
        );

        return (
          <div key={category.tag_name}>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold">{category.display_name}</h1>
              <div className="flex">
                <button onClick={() => handleScroll(index, 'left')}>
                  <img src={leftArrow} alt="Left" className="mr-2 w-8 h-8" />
                </button>
                <button onClick={() => handleScroll(index, 'right')}>
                  <img src={rightArrow} alt="Right" className="w-8 h-8" />
                </button>
              </div>
            </div>

            <div
              className="slider-container"
              id={`slider-container-${index}`}
              style={{
                overflowX: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'transform 0.5s ease-in-out',
              }}
            >
              {filteredProducts.map((product, idx) => (
                <div
                  key={`${product.id}-${idx}`}
                  style={{display: 'inline-block', marginRight: '10px'}}
                >
                  <ProductItem
                    product={product}
                    loading={idx < 8 ? 'eager' : undefined}
                  />
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
          {/* {console.log(product)}
          {console.log(product.tags)}
          {console.log(product.tags[2])} */}
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
