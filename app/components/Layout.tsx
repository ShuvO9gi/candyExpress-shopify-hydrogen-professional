import {Await} from '@remix-run/react';
import {Suspense, useState} from 'react';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header, HeaderMenu} from '~/components/Header';
import {CartMain} from '~/components/Cart';
import {
  PredictiveSearchForm,
  PredictiveSearchResults,
} from '~/components/Search';
import right_arrow from '../../public/right_arrow_sign.svg';
import left_arrow from '../../public/left_arrow_sign.svg';
import search_icon from '../../public/search_icon.svg';
import close_icon from '../../public/close_icon.svg';

export type LayoutProps = {
  cart: Promise<CartApiQueryFragment | null>;
  children?: React.ReactNode;
  footer: Promise<FooterQuery>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
};

export function Layout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
}: LayoutProps) {
  const [previous, setPrevious] = useState(false);
  const [productSelected, setProductSelected] = useState(true);
  const [searchCandy, setSearchCandy] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    console.log(currentStep);

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }

    if (currentStep > 1) {
      setPrevious(true);
    } else {
      setPrevious(false);
    }
  };

  const handlePrev = () => {
    // if (currentStep < 0) {
    //   setPrevious(false);
    // }

    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setPrevious(true);
    } else if (currentStep == 1) {
      setPrevious(false);
    }
  };

  return (
    <>
      {/* <CartAside cart={cart} />
      <SearchAside />
      <MobileMenuAside menu={header?.menu} shop={header?.shop} /> */}
      {header && <Header header={header} cart={cart} isLoggedIn={isLoggedIn} />}

      {productSelected && (
        <div className="sticky top-[52px] w-full h-[102px] bg-[#9C6EAA] z-[1] flex">
          <div className="ml-6 w-[316px]">
            <p className="font-bold text-xl text-white">Add Candy</p>
            <p className="font-normal text-sm text-white">
              Mix <span className="font-bold text-[#FFAD05]">23 gr.</span> more
              candy in the gift
            </p>
            <div className="w-full h-1 bg-[#FFAD05] rounded-full mt-2">
              <div className="bg-white w-[84%] h-1 rounded-full"></div>
            </div>
            <div className="ml-3 h-7 rounded-md bg-white/80 border border-[#622287] px-8 font-normal text-sm text-[#623D89] mt-1.5">
              Or click here to fill with random candy
            </div>
          </div>
          <div className="absolute w-10 h-10 rounded ml-[328px] mt-2 bg-[#D3B5D1]/15 flex justify-center items-center">
            <img src={search_icon} alt="search" width={18} height={18} />
          </div>
        </div>
      )}

      <main>{children}</main>
      <Suspense>
        {/* <Await resolve={footer}>
          {(footer) => <Footer menu={footer?.menu} shop={header?.shop} />}
        </Await> */}
      </Suspense>
      {searchCandy && (
        <div className="w-full h-[50px] bg-[#333333]/50 sticky bottom-[88px] z-[1] flex justify-center items-center">
          <input
            type="search"
            className="w-56 h-5 rounded text-[10px] font-normal text-black/50"
            placeholder="Search your candy"
          />
          <div className="w-4 h-4 bg-[#FFAD05] flex justify-center items-center absolute right-0 top-0">
            <img
              className=""
              src={close_icon}
              alt="close"
              width={6}
              height={6}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center w-[100%] h-[88px] bg-[#6E4695] sticky  bottom-0 z-[1]">
        <div className="w-[308px]">
          <div className="h-8 flex flex-nowrap items-center">
            <div className="w-full bg-[#D3B5D1] rounded-full h-1.5">
              <div
                id="progress-bar"
                className="bg-white h-1.5 w-[20%] rounded-full"
              ></div>
            </div>
            <p className="text-nowrap text-white ml-1.5">
              Step {currentStep} of 5
            </p>
          </div>
          <div className="flex">
            {previous && (
              <button
                id="progress-prev"
                className="flex justify-center items-center rounded-xl w-12 h-12 bg-white mr-4"
                onClick={() => handlePrev()}
              >
                <img
                  className=""
                  src={left_arrow}
                  alt="right"
                  width={6}
                  height={10}
                />
              </button>
            )}
            <div className="w-[308px] h-12 rounded-xl bg-[#C7F0BD] pr-5 pl-11 py-3 flex justify-end">
              <button
                id="progress-next"
                className="font-bold text-base text-[#323232] w-full flex justify-between items-center"
                onClick={() => handleNext()}
              >
                NEXT - SELECT CANDY
                <img
                  className=""
                  src={right_arrow}
                  alt="right"
                  width={6}
                  height={10}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CartAside({cart}: {cart: LayoutProps['cart']}) {
  return (
    <Aside id="cart-aside" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchAside() {
  return (
    <Aside id="search-aside" heading="SEARCH">
      <div className="predictive-search">
        <br />
        <PredictiveSearchForm>
          {({fetchResults, inputRef}) => (
            <div>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Search"
                ref={inputRef}
                type="search"
              />
              &nbsp;
              <button
                onClick={() => {
                  window.location.href = inputRef?.current?.value
                    ? `/search?q=${inputRef.current.value}`
                    : `/search`;
                }}
              >
                Search
              </button>
            </div>
          )}
        </PredictiveSearchForm>
        <PredictiveSearchResults />
      </div>
    </Aside>
  );
}

function MobileMenuAside({
  menu,
  shop,
}: {
  menu: HeaderQuery['menu'];
  shop: HeaderQuery['shop'];
}) {
  return (
    menu &&
    shop?.primaryDomain?.url && (
      <Aside id="mobile-menu-aside" heading="MENU">
        <HeaderMenu
          menu={menu}
          viewport="mobile"
          primaryDomainUrl={shop.primaryDomain.url}
        />
      </Aside>
    )
  );
}
