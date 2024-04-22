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
import closeBlackIcon from '../../public/action/close_icon.svg';
import searchBlackIcon from '../../public/action/search_black_icon.svg';
import searchWhiteIcon from '../../public/action/search_white_icon.svg';
import React, {useEffect, useRef, useState} from 'react';

import type {
  Category,
  MenuItems,
  TopMenu,
  VerticalMenu,
} from '~/dtos/collections.dto';
import {Swiper, SwiperSlide} from 'swiper/react';
import 'node_modules/swiper/swiper.css';
import SwiperCore from 'swiper/core';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
};

export async function loader({request, params, context}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 200,
  });

  console.log('first');
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
  /*  */
  const [searchCandy, setSearchCandy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<ProductItemFragment[]>([]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    const filtered = products.filter((item: ProductItemFragment) =>
      item.title.toLowerCase().includes(query.toLowerCase()),
    );

    setFilteredItems(filtered);
  };

  return (
    <>
      <div>
        {searchQuery === '' ? (
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
                  </div>

                  <Swiper
                    slidesPerView={'auto'}
                    spaceBetween={10}
                    navigation
                    scrollbar={{hide: true}}
                    speed={500}
                    threshold={10}
                    style={{
                      display: 'flex',
                      overflowX: 'hidden',
                      whiteSpace: 'nowrap',
                      flexDirection: 'row',
                    }}
                  >
                    {filteredProducts.map((product, idx) => (
                      <SwiperSlide
                        key={`${product.id}-${idx}`}
                        className="md:mr-5"
                      >
                        <ProductItem product={product} />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              );
            })}
          </div>
        ) : filteredItems.length > 0 ? (
          <div>
            {categories.map((category, index) => {
              const filteredProducts = filteredItems.filter((product) =>
                product.tags.includes(category.tag_name),
              );

              if (!filteredProducts.length) return null;

              return (
                <div key={category.tag_name}>
                  <div className="flex justify-between items-center md:mb-8 mb-4">
                    <h1 className="md:text-4xl text-2xl font-bold">
                      {category.display_name}
                    </h1>
                  </div>

                  <Swiper
                    slidesPerView={'auto'}
                    spaceBetween={10}
                    navigation
                    scrollbar={{hide: true}}
                    speed={500}
                    threshold={10}
                    style={{
                      display: 'flex',
                      overflowX: 'hidden',
                      whiteSpace: 'nowrap',
                      flexDirection: 'row',
                    }}
                  >
                    {filteredProducts.map((product, idx) => (
                      <SwiperSlide
                        key={`${product.id}-${idx}`}
                        className="md:mr-5"
                      >
                        <ProductItem product={product} />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              );
            })}
          </div>
        ) : (
          <div></div>
        )}
      </div>
      {searchCandy && (
        <div className="w-full h-[80px] bg-[#333333]/50 sticky bottom-[28px] lg:bottom-[124px] z-[1] flex justify-center items-center">
          <input
            type="search"
            className="w-[50%] h-[50%] rounded text-sm font-normal text-black/50"
            placeholder="Search your candy"
            onChange={(e) => handleInputChange(e)}
          />
          <button
            className="w-7 h-7 bg-[#FFAD05] flex justify-center items-center absolute right-0 top-0"
            onClick={() => {
              setSearchCandy(false);
              setSearchQuery('');
            }}
          >
            <img
              className=""
              src={closeBlackIcon}
              alt="close"
              width={12}
              height={12}
            />
          </button>
        </div>
      )}
      {/* {!searchCandy && ( */}
      <div className="lg:hidden w-[200px] h-7 bg-[#C7F0BD] rounded-se-lg sticky bottom-[0px] z-[1] flex items-center">
        <div className="ml-7 flex items-center text-xs font-semibold">
          Search Product Here
          <span
            className="ml-3"
            onClick={() => setSearchCandy(true)}
            onKeyDown={() => setSearchCandy(true)}
            role="button"
            tabIndex={0}
          >
            <img src={searchBlackIcon} alt="Search" width={16} height={16} />
          </span>
        </div>
      </div>
      {/* )} */}
      <div className="w-full h-[124px] bg-[#6E4695] sticky bottom-[0px] hidden lg:flex justify-evenly items-center">
        <div className="w-48 h-16 text-white">
          <p className="text-xl">Vægt: 350 g</p>
          <div className="font-bold text-[32px]">58,50 DKK</div>
        </div>
        <div className="w-[670px] flex justify-between items-center">
          <button
            className="hidden w-[50px] h-[50px] rounded-lg bg-[#FFAD05] lg:flex justify-center items-center"
            onClick={() => setSearchCandy(true)}
          >
            <img src={searchWhiteIcon} alt="Search" width={24} height={24} />
          </button>
          <div className="w-72 h-[60px] rounded-full border-2 border-white flex items-center justify-center uppercase text-white font-bold text-xl">
            Watch your bag
          </div>
          <div className="w-72 h-[60px] rounded-full bg-[#FFAD05] flex items-center justify-center uppercase text-white font-bold text-xl">
            Buy for 10 nok more
          </div>
        </div>
      </div>
    </>
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
    <div className="flex justify-center md:w-[246px] md:h-[310px] w-[152px] h-[230px]">
      <Link
        className="flex flex-col items-center product-item"
        key={product.id}
        prefetch="intent"
        to={variantUrl}
      >
        <div className="mt-0.5 w-[120px] h-[120px] md:w-[186px] md:h-[186px] relative">
          <img
            className="[&&]:w-[20px] [&&]:h-[20px] mt-[-2px] ml-[116px] md:ml-[170px] absolute"
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
        <div className="bg-[#D3B5D1]/[0.2] rounded-[14px] w-[144px] h-[130px] md:w-[246px] md:h-[212px] md:mt-[-98px] mt-[-50px] -z-10 flex flex-col items-center">
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
