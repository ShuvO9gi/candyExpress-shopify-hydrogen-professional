import {Await, NavLink} from '@remix-run/react';
import {Suspense, useState} from 'react';
import type {HeaderQuery} from 'storefrontapi.generated';
import type {LayoutProps} from './Layout';
import {useRootLoaderData} from '~/root';
import page_logo from '../../public/page_logo.svg';
import cart_black_logo from '../../public/cart_black_logo.svg';
import hamburger_icon from '../../public/hamburger_icon.svg';
import searchIcon from '../../public/search_black_icon.svg';
import downArrow from '../../public/down_arrow.svg';
import closeIcon from '../../public/close_white_icon.svg';

type HeaderProps = Pick<LayoutProps, 'header' | 'cart' | 'isLoggedIn'>;

type Viewport = 'desktop' | 'mobile';

export function Header({header, isLoggedIn, cart}: HeaderProps) {
  const {shop, menu} = header;
  return (
    <header className="header lg:flex-col mb-7 -mt-2 lg:mb-0 h-[50px] lg:h-[156px] w-full p-0 bg-white lg:bg-transparent">
      <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
        <div className="w-[102px] h-12 lg:w-44 lg:h-24 absolute top-2 left-[50%] translate-x-[-50%] lg:translate-x-0  lg:top-6 lg:left-[5%]">
          <img src={page_logo} alt="" />
        </div>
      </NavLink>
      <div className="hidden lg:flex justify-center items-center w-full h-[50px] bg-[#C7F0BD] font-normal text-base text-[#6E4695]">
        Bestil indenfor 1 time og 55 min og vi afsender i dag
      </div>
      <HeaderMenu
        menu={menu}
        cart={cart}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
      />
      <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} header={header} />
    </header>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  cart,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url'];
  viewport: Viewport;
  cart: HeaderProps['cart'];
}) {
  const {publicStoreDomain} = useRootLoaderData();
  const [submenu, setSubmenu] = useState(false);
  const className = `header-menu-${viewport} lg:flex lg:justify-center lg:items-center lg:w-full lg:h-[76px] bg-[#F7F7F7] ml-0 lg:gap-0`;

  function closeAside(event: React.MouseEvent<HTMLAnchorElement>) {
    if (viewport === 'mobile') {
      event.preventDefault();
      window.location.href = event.currentTarget.href;
    }
  }

  return (
    <nav className={className} role="navigation">
      <div className="hidden lg:flex justify-between w-fit">
        {viewport === 'mobile' && (
          <NavLink
            end
            onClick={closeAside}
            prefetch="intent"
            style={activeLinkStyle}
            to="/"
          >
            Home
          </NavLink>
        )}
        {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
          if (!item.url) return null;

          // if the url is internal, we strip the domain
          const url =
            item.url.includes('myshopify.com') ||
            item.url.includes(publicStoreDomain) ||
            item.url.includes(primaryDomainUrl)
              ? new URL(item.url).pathname
              : item.url;
          return (
            <div
              className="flex items-center content-center justify-center relative group"
              key={item.id}
            >
              <NavLink
                className="header-menu-item font-bold text-[17px] text-nowrap hover:no-underline px-5"
                end
                key={item.id}
                onClick={closeAside}
                prefetch="intent"
                style={activeLinkStyle}
                to={url}
              >
                {item.title}
              </NavLink>
              {item.title == 'Kurv' && <CartToggle cart={cart} />}
              {item.items.length > 0 && (
                <>
                  <button
                    className="flex items-center w-3 h-3 mt-1 -ml-4"
                    onClick={() => {
                      setSubmenu(true);
                      if (submenu) {
                        setSubmenu(false);
                      }
                    }}
                  >
                    <img
                      className="rounded-none"
                      src={downArrow}
                      alt="Show submenu"
                      width={10}
                      height={8}
                    />
                  </button>
                  {/* {submenu && ( */}
                  <ul className="w-44 absolute top-[100%] left-[0%] bg-white rounded-xl border-2 border-[#c7f0bd] border-solid invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-[opacity, visibility] ease duration-500">
                    {item.items.map((sub) => (
                      <li
                        key={sub.id}
                        className="font-bold text-base hover:block hover:bg-slate-200 p-2 mb-0 cursor-pointer"
                      >
                        {sub.title}
                      </li>
                    ))}
                  </ul>
                  {/* )} */}
                </>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
  header,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart' | 'header'>) {
  const menu = header.menu;
  const primaryDomainUrl = header.shop.primaryDomain.url;
  return (
    <nav
      className="flex lg:hidden items-center justify-between w-full h-full ml-4 mr-4 mt-5"
      role="navigation"
    >
      <HeaderMenuMobileToggle menu={menu} primaryDomainUrl={primaryDomainUrl} />
      {/* <NavLink prefetch="intent" to="/account" style={activeLinkStyle}>
        <Suspense fallback="Sign in">
          <Await resolve={isLoggedIn} errorElement="Sign in">
            {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign in')}
          </Await>
        </Suspense>
      </NavLink> */}
      <div className="flex">
        <SearchToggle />
        <CartToggle cart={cart} />
      </div>
    </nav>
  );
}

function HeaderMenuMobileToggle({
  menu,
  primaryDomainUrl,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url'];
}) {
  const [showMobileNavigation, setShowMobileNavigation] = useState(false);
  const {publicStoreDomain} = useRootLoaderData();
  return (
    <>
      <button
        className="header-menu-mobile-toggle flex lg:hidden justify-center group"
        /* href="#mobile-menu-aside" */
        onClick={() => setShowMobileNavigation(true)}
      >
        <img
          className="rounded-none"
          src={hamburger_icon}
          alt="Toggle menu"
          width={20}
          height={16}
        />
      </button>
      {showMobileNavigation && (
        <div className="mobile-navigation fixed top-0 left-0 w-full h-screen bg-none z-[999]">
          <div className="mobile_navigation_wrapper relative w-full h-screen pr-0 pl-0 pt-6 pb-12 bg-[url('../../public/mobile_navigation_bg.svg')] bg-[#6E4695] bg-cover overflow-auto translate-x-0 group-hover:translate-x-full transition-[transform] ease-in-out duration-300">
            <button
              className="flex items-center justify-center w-[50px] h-[50px] absolute top-0 right-0 bg-[#6E4695]"
              onClick={() => {
                setShowMobileNavigation(false);
              }}
            >
              <img src={closeIcon} alt="" width={16} height={16} />
            </button>
            <div className="absolute top-[22px] left-[26px]">
              <img src={page_logo} alt="" width={86} height={46} />
            </div>
            <nav className="mt-40 flex justify-center">
              <ul className="w-[78%]">
                {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
                  const url =
                    item.url!.includes('myshopify.com') ||
                    item.url!.includes(publicStoreDomain) ||
                    item.url!.includes(primaryDomainUrl)
                      ? new URL(item.url!).pathname
                      : item.url!;
                  return (
                    <li
                      key={item.id}
                      className="flex justify-end items-center w-auto rounded-3xl bg-[#9C6EAA] uppercase text-white font-bold text-sm no-underline p-3.5 [&:not(:first-child)]:mt-5"
                    >
                      <NavLink
                        className="flex items-center pr-6 hover:no-underline"
                        end
                        prefetch="intent"
                        to={url}
                        onClick={() => {
                          setShowMobileNavigation(false);
                        }}
                      >
                        {item.title}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function SearchToggle() {
  return (
    <a className="flex lg:hidden" href="#search-aside">
      <img
        className="rounded-none"
        src={searchIcon}
        alt="Search"
        width={20}
        height={20}
      />
    </a>
  );
}

function CartBadge({count}: {count: number}) {
  return (
    <div className="w-9 h-8 ml-4 lg:-ml-4 relative lg:relative flex items-center">
      <a className="lg:static" href="/cart">
        <img
          className="rounded-none"
          src={cart_black_logo}
          alt="Cart"
          width={17}
          height={17}
        />
      </a>
      <div className="w-[22px] lg:w-6 h-[22px] lg:h-6 bg-[#FFAD05] rounded-full absolute -top-1 left-[14px] text-white font-bold text-lg flex justify-center items-center">
        {count}
      </div>
    </div>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        {(cart) => {
          if (!cart) return <CartBadge count={0} />;
          return <CartBadge count={cart.totalQuantity || 0} />;
        }}
      </Await>
    </Suspense>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

function activeLinkStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'black',
  };
}
