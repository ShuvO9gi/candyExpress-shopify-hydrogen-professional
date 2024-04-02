import {json, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import {useEffect, useRef, useState} from 'react';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import infoIcon from '../../public/icon_info.svg';
import leftArrow from '../../public/left_arrow.svg';
import rightArrow from '../../public/right_arrow.svg';
import plus from '../../public/plus_white_sign.svg';
import minus from '../../public/minus_white_sign.svg';
import transportIcon from '../../public/transport_icon.svg';
import watchIcon from '../../public/watch_icon.svg';

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
      <div className="font-bold text-base text-[#323232]">
        Mix today — Get it delivered by express.
      </div>
      <div className="flex justify-between items-center w-[90%] h-14 ml-5 mt-6 mb-2">
        <div className="flex items-center">
          <img src={transportIcon} alt="" width={39} height={38} />
          <div className="flex flex-col ml-3 text-[#323232]">
            <div className="font-bold text-[10px]">Gratis fragt</div>
            <p className="w-[60%] font-normal text-[8px]">
              Køb for over 399 kr. og få gratis fragt
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <img src={watchIcon} alt="" />
          <div className="flex flex-col ml-3 text-[#323232]">
            <div className="font-bold text-[10px]">Vi sender i dag</div>
            <p className="w-[60%] font-normal text-[8px]">
              Bestil inden 14:00 (alle hverdage)
            </p>
          </div>
        </div>
      </div>
      <div>
        {categories.map((category, index) => {
          const filteredProducts = products.filter((product) =>
            product.tags.includes(category.tag_name),
          );

          if (!filteredProducts.length) return null;

          return (
            <div key={category.tag_name}>
              <div className="flex justify-between items-center md:mb-8 mb-4">
                <h1 className="md:text-4xl text-2xl font-bold">
                  {category.display_name}
                </h1>
                <div className="hidden md:flex">
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
                  <div key={`${product.id}-${idx}`} className=" md:mr-5">
                    <ProductItem product={product} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
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
  const [weightCalculation, setWeightCalculation] = useState(false);
  const [quantity, setQuantity] = useState(6);
  const [weight, setWeight] = useState(36);
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);

  const openWeightModal = () => {
    setWeightCalculation(true);
  };

  const deductWeight = (e: any) => {
    e.stopPropagation();
    if (quantity > 6) {
      setQuantity((prev) => prev - 6);
      setWeight((prev) => prev - 36);
    }

    if (quantity === 6) {
      setWeightCalculation(false);
    }
  };

  const addWeight = (e: any) => {
    e.stopPropagation();
    setQuantity((prev) => prev + 6);
    setWeight((prev) => prev + 36);
  };

  return (
    <div className="flex justify-center md:w-[246px] md:h-[310px] w-[164px] h-[230px]">
      {/* <Link prefetch="intent" to={variantUrl}>
        <img
          className="w-[20px] [&&]:h-[20px] absolute top-[0px] right-[18px] z-10"
          src={infoIcon}
          alt="Details information"
        />
      </Link> */}
      <div
        className="flex flex-col items-center product-item"
        key={product.id}
        role="button"
        onClick={() => openWeightModal()}
        onKeyDown={() => openWeightModal()}
        tabIndex={0}
      >
        <div className="mt-0.5 w-[120px] h-[120px] md:w-[186px] md:h-[186px] relative">
          <Link
            prefetch="intent"
            to={variantUrl}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              className="[&&]:w-[20px] [&&]:h-[20px] top-[-2px] left-[116px] md:left-[170px] absolute"
              src={infoIcon}
              alt="image_import"
            />
          </Link>
          {product.featuredImage && (
            <Image
              alt={product.featuredImage.altText || product.title}
              aspectRatio="1/1"
              data={product.featuredImage}
              loading={loading}
              sizes="(min-width: 45em) 400px, 100vw"
              className="p-2 z-10"
            />
          )}
        </div>
        {!weightCalculation && (
          <div className="bg-[#D3B5D1]/[0.2] rounded-[14px] w-[144px] h-[130px] md:w-[246px] md:h-[212px] md:mt-[-98px] mt-[-50px] flex flex-col items-center">
            <h4 className="md:mt-[90px] mt-[40px] font-bold md:text-[18px] text-[14px]">
              {product.title}
            </h4>
            <small className="font-semibold md:text-[14px] text-[12px] text-[#9C6EAA]">
              <Money data={product.priceRange.minVariantPrice} />
            </small>
            <button className="w-[124px] md:w-[206px] h-[50px] py-1 rounded-full border-0 bg-[#FFAD05] mt-[10px] mb-[20px] font-bold md:text-xl text-sm text-white tracking-wide">
              PUT I KURV
            </button>
          </div>
        )}

        {weightCalculation && (
          <div className="bg-[#6E4695] rounded-[14px] w-[144px] h-[130px] md:w-[246px] md:h-[212px] md:mt-[-98px] mt-[-50px] flex flex-col items-center">
            <h4 className="md:mt-[90px] mt-[40px] font-bold md:text-[18px] text-[14px] text-white">
              {product.title}
            </h4>
            <small className="font-semibold md:text-[14px] text-[12px] text-[#D3B5D1]">
              <Money data={product.priceRange.minVariantPrice} />
            </small>
            <div className="flex justify-between items-center w-[124px] w-36 md:w-[206px] h-[50px] py-1 rounded-full border-0 bg-white mt-0.5 mb-[20px]">
              <div className="flex justify-center items-center w-6 h-6 rounded-full ml-1 bg-[#FFAD05]">
                <button className="w-4 h-4" onClick={(e) => deductWeight(e)}>
                  <img src={minus} alt="Subtract" width={16} height={16} />
                </button>
              </div>
              <div className="flex flex-col items-center">
                <div className="font-bold text-[10px] text-[#323232] text-center">
                  Ca. {quantity} stk.
                </div>
                <div className="w-[125%] w-16 h-[1px] bg-[#D3B5D1]/[0.5]"></div>
                <div className="font-normal text-[10px] text-[#323232] text-center">
                  {weight} gram
                </div>
              </div>
              <div className="flex justify-center items-center w-6 h-6 rounded-full mr-1 bg-[#FFAD05]">
                <button className="w-4 h-4" onClick={(e) => addWeight(e)}>
                  <img src={plus} alt="Add" width={16} height={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
