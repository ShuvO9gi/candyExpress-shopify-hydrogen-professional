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
import Slider from 'react-slick';
import React, {createRef, useEffect, useRef, useState} from 'react';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

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
  const [categories, setCategories] = useState(['Silk', 'Candy', 'Chocolate']);
  // useEffect(() => {
  //   const fetchMenuItemsData = async () => {
  //     try {
  //       const menuItems = await fetchMenuItems();
  //       if (menuItems) {
  //         console.log('Menu Items:', menuItems);
  //         setCategories(menuItems);
  //       } else {
  //         console.log('Failed to fetch menu items');
  //       }
  //     } catch (error) {
  //       console.error('Error fetching menu items:', error);
  //     }
  //   };

  //   fetchMenuItemsData();
  // }, []);

  // let slider: any = useRef(null);

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

async function fetchMenuItems() {
  try {
    const response = await fetch(
      'https://staging.candyexpress.com/api/v1/menu-item',
    );

    if (!response.ok) {
      throw new Error('Failed to fetch menu items');
    }

    const menuItems = await response.json();
    return menuItems;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return null;
  }
}

function ProductsGrid({
  products,
  categories,
}: {
  products: ProductItemFragment[];
  categories: string[];
}) {
  const sliderRefs = useRef<Array<any>>([]);
  const settings = {
    /* className: 'center', */
    infinite: false,
    speed: 500,
    /* centerPadding: '60px', */
    slidesToShow: 5,
    slidesToScroll: 4,
    swipeToSlide: true,
    arrows: false,
  };

  // Ensure the sliderRefs array is initialized with refs for each category
  useEffect(() => {
    sliderRefs.current = Array(categories.length)
      .fill(null)
      .map(() => createRef());
  }, [categories]);

  const next = (index: number) => {
    if (sliderRefs.current[index].current) {
      sliderRefs.current[index].current.slickNext();
    }
  };

  const previous = (index: number) => {
    if (sliderRefs.current[index].current) {
      sliderRefs.current[index].current.slickPrev();
    }
  };

  return (
    <div>
      {categories.map((category, index) => (
        <div key={index}>
          <div className="flex justify-between">
            <h1 className="text-4xl font-bold mb-8">{category}</h1>
            <div className="flex mb-12">
              <button onClick={() => previous(index)}>
                <img src={leftArrow} alt="Left" className="mr-2 w-8 h-8" />
              </button>
              <button onClick={() => next(index)}>
                <img src={rightArrow} alt="Right" className="w-8 h-8" />
              </button>
            </div>
          </div>

          <div className="/* products-grid */  slider-container">
            <Slider {...settings} ref={sliderRefs.current[index]}>
              {products.map((product, idx) => (
                <ProductItem
                  key={idx}
                  product={product}
                  loading={idx < 8 ? 'eager' : undefined}
                />
              ))}
            </Slider>
          </div>
        </div>
      ))}
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
