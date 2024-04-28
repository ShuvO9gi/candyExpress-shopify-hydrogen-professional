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
import filterWhiteIcon from '../../public/action/filter_white_icon.svg';
import filterBlackIcon from '../../public/action/filter_black_icon.svg';
import React, {useEffect, useRef, useState} from 'react';
import {useSwiper, Swiper, SwiperSlide} from 'swiper/react';

import type {
  Category,
  MenuItems,
  TopMenu,
  VerticalMenu,
} from '~/dtos/collections.dto';

import 'node_modules/swiper/swiper.css';
import {FreeMode, Navigation, HashNavigation} from 'swiper/modules';

import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

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
  const swiper = useSwiper();

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
      <div className="min-h-screen">
        {searchQuery === '' ? (
          <div>
            {categories.map((category, index) => {
              const filteredProducts = products.filter((product) =>
                product.tags.includes(category.tag_name),
              );

              const handleReachEnd = () => {
                // Add animation effect when reaching the end
                const slider = document.querySelector('.swiper-wrapper');
                if (slider) {
                  slider.classList.add('bounce-end');
                  setTimeout(() => {
                    slider.classList.remove('bounce-end');
                  }, 500); // Duration of the animation
                }
              };

              const handleReachBeginning = () => {
                // Add animation effect when reaching the beginning
                const slider = document.querySelector('.swiper-wrapper');
                if (slider) {
                  slider.classList.add('bounce-start');
                  setTimeout(() => {
                    slider.classList.remove('bounce-start');
                  }, 500); // Duration of the animation
                }
              };

              if (!filteredProducts.length) return null;

              return (
                <div key={category.tag_name}>
                  <div className="flex justify-between items-center md:mb-8 mb-4">
                    <h1 className="md:text-4xl text-2xl font-bold">
                      {category.display_name}
                    </h1>

                    <div className="md:flex items-center hidden">
                      <button
                        className="mr-2"
                        onClick={() => swiper.slidePrev()}
                      >
                        <img src={leftArrow} alt="left_arrow" />
                      </button>
                      <button onClick={() => swiper.slideNext()}>
                        <img src={rightArrow} alt="right_arrow" />
                      </button>
                    </div>
                  </div>

                  <Swiper
                    slidesPerView={'auto'}
                    spaceBetween={10}
                    navigation
                    scrollbar={{hide: true}}
                    onReachEnd={handleReachEnd}
                    onReachBeginning={handleReachBeginning}
                    freeMode={true}
                    modules={[FreeMode]}
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
          <div className="min-h-screen">
            {categories.map((category, index) => {
              const filteredProducts = filteredItems.filter((product) =>
                product.tags.includes(category.tag_name),
              );

              const handleReachEnd = () => {
                // Add animation effect when reaching the end
                const slider = document.querySelector('.swiper-wrapper');
                if (slider) {
                  slider.classList.add('bounce-end');
                  setTimeout(() => {
                    slider.classList.remove('bounce-end');
                  }, 500); // Duration of the animation
                }
              };

              const handleReachBeginning = () => {
                // Add animation effect when reaching the beginning
                const slider = document.querySelector('.swiper-wrapper');
                if (slider) {
                  slider.classList.add('bounce-start');
                  setTimeout(() => {
                    slider.classList.remove('bounce-start');
                  }, 500); // Duration of the animation
                }
              };

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
                    onReachEnd={handleReachEnd}
                    onReachBeginning={handleReachBeginning}
                    freeMode={true}
                    modules={[FreeMode]}
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
          <div className="min-h-screen"></div>
        )}
      </div>
      {searchCandy && (
        <div className="-mx-2 w-[100%] h-[86px] bg-[#333333]/50 fixed bottom-20 lg:bottom-20 xl:bottom-[98px] flex justify-center items-center z-[1]">
          <input
            type="search"
            className="py-2.5 px-3 w-[50%] h-[53%] rounded text-sm font-normal text-black/50"
            placeholder="Søg efter slik her"
            onChange={(e) => handleInputChange(e)}
          />
          <button
            className="p-0.5 w-10 h-[34px] bg-[#FFAD05] flex justify-center items-center absolute right-1 top-1"
            onClick={() => {
              setSearchCandy(false);
              setSearchQuery('');
            }}
          >
            <img
              className=""
              src={closeBlackIcon}
              alt="close"
              width={14}
              height={18}
            />
          </button>
        </div>
      )}
      {/* {!searchCandy && ( */}
      <div className="-mx-2 lg:hidden py-0.5 px-2.5 bg-[#acddd6] rounded-se-[10px] fixed bottom-20 flex items-center">
        <div className="flex items-center text-xs font-semibold">
          <div>
            <button
              className="py-0 px-4 lg:flex justify-center items-center text-white"
              /* onClick={() => setSearchCandy(true)} */
            >
              <img
                src={filterBlackIcon}
                alt="Search Filter"
                width={15}
                height={15}
              />
            </button>
          </div>
          <span
            onClick={() => setSearchCandy(true)}
            onKeyDown={() => setSearchCandy(true)}
            role="button"
            tabIndex={0}
          >
            <img src={searchBlackIcon} alt="Search" />
          </span>
        </div>
      </div>
      {/* )} */}
      <div className="-mx-2 w-[100%] h-20 xl:h-[98px] bg-[#6E4695] fixed bottom-0 lg:flex lg:justify-evenly lg:items-center">
        <div className="w-[90%] h-full sm:w-[415px] lg:w-[768px] xl:w-[1130px] mx-auto flex flex-col justify-center lg:flex-row lg:items-center">
          <div className="text-white flex flex-row lg:flex-col justify-between lg:justify-center lg:flex-start lg:w-[30%] xl:w-[40%] lg:h-16">
            <p className="text-sm lg:text-base">
              <span>Gram</span>: <span>0 g.</span>
            </p>
            <div className="font-bold text-base lg:text-xl">
              <span>Pris</span>: <span>0 kr.</span>
            </div>
          </div>
          <div className="lg:w-[70%] xl:w-[60%] flex justify-between items-center">
            <div className="mr-0 lg:mr-[42px]"></div>
            <div className="lg:py-0 lg:px-4">
              <button
                className="mt-1 mr-1.5 hidden w-[42px] h-[42px] rounded-full bg-[#FFAD05] hover:bg-[#8f93a770] lg:flex justify-center items-center text-white"
                /* onClick={() => setSearchCandy(true)} */
              >
                <img
                  src={filterWhiteIcon}
                  alt="Search Filter"
                  width={16}
                  height={16}
                />
              </button>
            </div>
            <div>
              <button
                className="mr-[26px] hidden w-[42px] h-[42px] rounded-full bg-[#FFAD05] hover:bg-[#8f93a770] lg:flex justify-center items-center"
                onClick={() => setSearchCandy(true)}
              >
                <img src={searchWhiteIcon} alt="Search" className="" />
              </button>
            </div>
            <div className="py-1.5 xl:py-0 xl:px-2.5 mt-1 mr-2.5 xl:mt-0 xl:mr-[30px] w-[100%] xl:h-[60px] rounded-full border-2 border-white flex items-center justify-center uppercase text-white font-bold text-xs lg:text-base">
              SE DIN POSE
            </div>
            <div className="py-1.5 xl:py-0 xl:px-2.5 mt-1 xl:mt-0 xl:mr-[30px] w-[100%] xl:h-[60px] rounded-full bg-[#FFAD05] flex items-center justify-center uppercase text-white lg:text-nowrap font-bold text-xs lg:text-base">
              KØB FOR <span> 0 </span> KR. MERE
            </div>
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
    <div className="flex justify-center md:w-[246px] md:h-[310px] w-[152px] h-[230px] ">
      <div className="flex flex-col items-center product-item" key={product.id}>
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
        <div className="bg-[#D3B5D1]/[0.2] rounded-[14px] w-[144px] h-[130px] md:w-[246px] md:h-[212px] md:mt-[-98px] mt-[-50px] flex flex-col items-center select-all">
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
