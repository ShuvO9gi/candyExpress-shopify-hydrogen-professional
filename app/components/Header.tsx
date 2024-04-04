import {Await, NavLink} from '@remix-run/react';
import {Suspense} from 'react';
import type {HeaderQuery} from 'storefrontapi.generated';
import type {LayoutProps} from './Layout';
import {useRootLoaderData} from '~/root';
import page_logo from '../../public/page_logo.svg';
import cart_black_logo from '../../public/cart_black_logo.svg';
import hamburger_icon from '../../public/hamburger_icon.svg';
import searchIcon from '../../public/search_black_icon.svg';

type HeaderProps = Pick<LayoutProps, 'header' | 'cart' | 'isLoggedIn'>;

type Viewport = 'desktop' | 'mobile';

export function Header({header, isLoggedIn, cart}: HeaderProps) {
  const {shop, menu} = header;
  return (
    <header className="header mb-7 h-[50px] w-full py-10 bg-white fixed">
      <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
        <strong className="left-36 absolute top-2">
          <img src={page_logo} alt="" width={102} height={48} />
        </strong>
      </NavLink>
      <HeaderMenu
        menu={menu}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
      />
      <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
    </header>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url'];
  viewport: Viewport;
}) {
  const {publicStoreDomain} = useRootLoaderData();
  const className = `header-menu-${viewport}`;

  function closeAside(event: React.MouseEvent<HTMLAnchorElement>) {
    if (viewport === 'mobile') {
      event.preventDefault();
      window.location.href = event.currentTarget.href;
    }
  }

  return (
    <nav className={className} role="navigation">
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
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={closeAside}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  return (
    <nav className="flex items-center w-full h-full ml-7" role="navigation">
      <HeaderMenuMobileToggle />
      {/* <NavLink prefetch="intent" to="/account" style={activeLinkStyle}>
        <Suspense fallback="Sign in">
          <Await resolve={isLoggedIn} errorElement="Sign in">
            {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign in')}
          </Await>
        </Suspense>
      </NavLink> */}
      <SearchToggle />
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  return (
    <a className="mt-5" href="#mobile-menu-aside">
      <img
        className="rounded-none"
        src={hamburger_icon}
        alt="Toggle menu"
        width={20}
        height={16}
      />
    </a>
  );
}

function SearchToggle() {
  return (
    <a className="ml-[250px] mt-5" href="#search-aside">
      <img src={searchIcon} alt="Search" width={20} height={20} />
    </a>
  );
}

function CartBadge({count}: {count: number}) {
  return (
    <div className="w-9 h-8 ml-4 relative">
      <a className="absolute top-4" href="/cart">
        <img src={cart_black_logo} alt="Cart" width={18} height={18} />
      </a>
      <div className="w-[22px] h-[22px] bg-[#FFAD05] rounded-full absolute top-[2px] left-[14px] text-white font-bold text-lg flex justify-center items-center">
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
