/* eslint-disable prettier/prettier */
import { json, redirect, type LoaderFunctionArgs } from '@shopify/remix-oxygen';
import { useLoaderData, Link, type MetaFunction } from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import type { ProductItemFragment } from 'storefrontapi.generated';
import { useVariantUrl } from '~/lib/variants';
import infoIcon from '../../public/icon_info.svg';
import leftArrow from '../../public/left_arrow.svg';
import rightArrow from '../../public/right_arrow.svg';
import Slider from 'react-slick';
import React, { Component, useRef } from 'react';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.collection.title ?? ''} Collection` }];
};

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const { handle } = params;
  const { storefront } = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  if (!handle) {
    return redirect('/collections');
  }

  const { collection } = await storefront.query(COLLECTION_QUERY, {
    variables: { handle, ...paginationVariables },
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }
  return json({ collection });
}


export default function Collection() {
  const { collection } = useLoaderData<typeof loader>();
  fetchMenuItems().then((menuItems) => {
    if (menuItems) {
      console.log('Menu Items:', JSON.stringify(menuItems));
      // Process menu items here
      console.log(menuItems[tag_name]);
    } else {
      console.log('Failed to fetch menu items');
    }
  });

  // let slider: any = useRef(null);

  return (
    <div className="collection">
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-[32px] text-[#323232]">
          {collection.title}
        </h1>
        <div className="flex justify-around">
          <img src={leftArrow} alt="Left" className="mr-2 w-8 h-8" onClick={() => { slider?.current?.slickPrev(); console.log("Prev"); }} />
          <img src={rightArrow} alt="Right" className="w-8 h-8" onClick={() => slider?.current?.slickNext()} />
        </div>
      </div>
      {/* <p className="collection-description">{collection.description}</p> */}
      <Pagination connection={collection.products}>
        {({ nodes, isLoading, PreviousLink, NextLink }) => (
          <>
            <PreviousLink>
              {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
            </PreviousLink>
            <ProductsGrid products={nodes} />
            <br />
            <NextLink>
              {isLoading ? 'Loading...' : <span>Load more ↓</span>}
            </NextLink>
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
function ProductsGrid({ products }: { products: ProductItemFragment[] }) {
  // let slider: any = useRef(null);
  let sliderRef: any = useRef(null);
  const next = () => {
    sliderRef.slickNext();
  };

  const previous = () => {
    sliderRef.slickPrev();
  }

  let settings = {
    className: 'center',
    infinite: false,
    speed: 500,
    centerPadding: '60px',
    slidesToShow: 5,
    slidesToScroll: 3,
    swipeToSlide: true,
    arrows: false,
  };

  return (
    <>
      <div className="flex justify-end mb-12" >
        <img src={leftArrow} alt="Left" className="mr-2 w-8 h-8" onClick={previous} />
        <img src={rightArrow} alt="Right" className="w-8 h-8" onClick={next} />
      </div>
      <div className="/* products-grid */  slider-container">

        {/* <Slider {...settings} ref={slider} > */}
        <Slider {...settings} ref={(slider: any) => { sliderRef = slider; }} >
          {products.map((product, index) => {
            return (
              <ProductItem
                key={product.id}
                product={product}
                loading={index < 8 ? 'eager' : undefined}
              />
            );
          })}
        </Slider>
      </div >
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
        <div
          className="bg-[#D3B5D1]/[0.2] rounded-[14px] w-[246px] h-[212px] mt-[-98px] -z-10 flex flex-col items-center"
        >
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
