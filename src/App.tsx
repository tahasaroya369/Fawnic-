import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider } from './context/AuthContext.js';
import { CartProvider } from './context/CartContext.js';
import { WishlistProvider } from './context/WishlistContext.js';
import { notificationSocket } from './services/notificationSocket.js';
import { setCachedProducts, setCachedCategories, prefetchProductImages } from './services/productCache.js';

// Common Components
import { Navbar } from './components/common/Navbar.js';
import { Footer } from './components/common/Footer.js';
import { CartDrawer } from './components/common/CartDrawer.js';
import { QuickViewModal } from './components/common/QuickViewModal.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

// Pages
import { Home } from './pages/Home.js';
import { Shop } from './pages/Shop.js';
import { ProductDetail } from './pages/ProductDetail.js';
import { CartPage } from './pages/CartPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { OrderSuccessPage } from './pages/OrderSuccessPage.js';
import { CustomerDashboard } from './pages/CustomerDashboard.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { ContactPage } from './pages/ContactPage.js';
import { PolicyPage } from './pages/PolicyPage.js';
import { HelpCenterPage } from './pages/HelpCenterPage.js';
import { TermsPage } from './pages/TermsPage.js';
import { PrivacyPage } from './pages/PrivacyPage.js';
import { ShippingPage } from './pages/ShippingPage.js';
import { ReturnsPolicyPage } from './pages/ReturnsPolicyPage.js';
import { ReviewsPage } from './pages/ReviewsPage.js';

import type { Product, Order } from './types.js';

interface NavigationState {
  route: string;
  param?: any;
}

function parseRoute(): NavigationState {
  const pathname = window.location.pathname.replace(/^\/+/, '');
  const hash = window.location.hash.replace(/^#\/?/, '');
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab');
  const queryIdParam = searchParams.get('queryId');

  if (pathname.startsWith('aliadmin')) {
    const parts = pathname.split('/');
    return { route: 'aliadmin', param: parts[1] || 'dashboard' };
  }

  if (hash) {
    const cleanHash = hash.split('?')[0];
    const parts = cleanHash.split('/');
    if (parts[0] === 'aliadmin' || parts[0] === 'admin-dashboard') {
      return { route: 'aliadmin', param: parts[1] || 'dashboard' };
    }
    if (parts[0] === 'products') {
      return { route: 'shop', param: parts[1] || undefined };
    }
    if (parts[0] === 'profile') {
      return {
        route: 'profile',
        param: {
          tab: tabParam || parts[1] || 'overview',
          queryId: queryIdParam || undefined,
        },
      };
    }
    return { route: parts[0] || 'home', param: parts[1] || undefined };
  }

  if (pathname) {
    const cleanPath = pathname.split('?')[0];
    const parts = cleanPath.split('/');
    if (parts[0] === 'products') {
      return { route: 'shop', param: parts[1] || undefined };
    }
    if (parts[0] === 'profile') {
      return {
        route: 'profile',
        param: {
          tab: tabParam || parts[1] || 'overview',
          queryId: queryIdParam || undefined,
        },
      };
    }
    return { route: parts[0] || 'home', param: parts[1] || undefined };
  }

  return { route: 'home' };
}

function MainApp() {
  const [navState, setNavState] = useState<NavigationState>(() => parseRoute());

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [storeSettings, setStoreSettings] = useState<any>(null);

  // Lightweight branded welcome / initialization screen
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const welcomed = sessionStorage.getItem('fawnic_welcomed');
      const isSpecialRoute =
        window.location.hash.includes('aliadmin') ||
        window.location.pathname.includes('aliadmin');
      return !welcomed && !isSpecialRoute;
    }
    return false;
  });

  useEffect(() => {
    if (!isInitialLoading) return;

    let isDone = false;
    const finish = () => {
      if (isDone) return;
      isDone = true;
      try {
        sessionStorage.setItem('fawnic_welcomed', '1');
      } catch (_) {}
      setIsInitialLoading(false);
    };

    // Preload critical datasets in parallel so the initial paint is instant
    Promise.allSettled([
      fetch('/api/settings')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setStoreSettings(data);
        })
        .catch(() => {}),
      fetch('/api/products?limit=50')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.products) {
            setCachedProducts(data.products);
            prefetchProductImages(data.products);
          }
        })
        .catch(() => {}),
      fetch('/api/categories')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) setCachedCategories(data);
        })
        .catch(() => {}),
    ]).then(() => {
      setTimeout(finish, 180);
    });

    const fallbackTimeout = setTimeout(finish, 650);
    return () => clearTimeout(fallbackTimeout);
  }, [isInitialLoading]);

  // Connect realtime websocket and load public settings
  useEffect(() => {
    notificationSocket.connect();

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setStoreSettings(data))
      .catch(() => {});

    const handleSettingsChange = (e: any) => {
      if (e.detail?.settings) {
        setStoreSettings(e.detail.settings);
      }
    };

    window.addEventListener('fawnic:settings_change', handleSettingsChange);
    return () => {
      window.removeEventListener('fawnic:settings_change', handleSettingsChange);
    };
  }, []);

  // Sync with browser hash and popstate changes
  useEffect(() => {
    const handleUrlChange = () => {
      setNavState(parseRoute());
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const navigate = (route: string, param?: any) => {
    setNavState({ route, param });
    if (route === 'aliadmin') {
      const sub = param ? `/${param}` : '';
      window.location.hash = `aliadmin${sub}`;
      if (window.location.pathname.startsWith('/aliadmin')) {
        window.history.pushState(null, '', `/aliadmin${sub}`);
      }
    } else if (typeof param === 'string') {
      window.location.hash = `${route}/${param}`;
    } else {
      window.location.hash = route;
    }
    // Instant jump to top for fast, responsive page transitions
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    switch (navState.route) {
      case 'products':
      case 'shop':
        return (
          <Shop
            onNavigate={navigate}
            onQuickView={setQuickViewProduct}
            initialCategory={navState.param?.category || (typeof navState.param === 'string' ? navState.param : undefined)}
          />
        );
      case 'product':
        return (
          <ProductDetail
            slug={navState.param}
            onNavigate={navigate}
            onQuickView={setQuickViewProduct}
          />
        );
      case 'cart':
        return <CartPage onNavigate={navigate} />;
      case 'checkout':
        return <CheckoutPage onNavigate={navigate} />;
      case 'order-success':
        return (
          <OrderSuccessPage
            order={navState.param as Order}
            onNavigate={navigate}
          />
        );
      case 'profile':
      case 'track':
        return (
          <CustomerDashboard
            initialTab={navState.route === 'track' ? 'track' : (navState.param?.tab || 'overview')}
            initialOrderNumber={navState.route === 'track' ? (typeof navState.param === 'string' ? navState.param : undefined) : undefined}
            initialQueryId={navState.param?.queryId}
            onNavigate={navigate}
          />
        );
      case 'aliadmin':
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={navigate} />;
      case 'login':
        return (
          <LoginPage
            onNavigate={navigate}
            defaultRole={navState.param?.role || 'customer'}
          />
        );
      case 'register':
        return <RegisterPage onNavigate={navigate} />;
      case 'about':
        return <AboutPage onNavigate={navigate} />;
      case 'reviews':
      case 'testimonials':
        return <ReviewsPage onNavigate={navigate} />;
      case 'contact':
        return <ContactPage onNavigate={navigate} />;
      case 'help':
      case 'faq':
        return <HelpCenterPage onNavigate={navigate} />;
      case 'terms':
      case 'terms-and-conditions':
        return <TermsPage onNavigate={navigate} />;
      case 'privacy':
      case 'privacy-policy':
        return <PrivacyPage onNavigate={navigate} />;
      case 'shipping':
      case 'delivery':
        return <ShippingPage onNavigate={navigate} />;
      case 'returns':
      case 'returns-policy':
      case 'return-policy':
        return <ReturnsPolicyPage onNavigate={navigate} />;
      case 'policies':
        return (
          <PolicyPage
            initialSection={navState.param?.section || 'shipping'}
          />
        );
      case 'home':
      default:
        return (
          <Home
            onNavigate={navigate}
            onQuickView={setQuickViewProduct}
          />
        );
    }
  };

  const isAdminRoute = navState.route === 'aliadmin' || navState.route === 'admin-dashboard';

  // Completely isolate admin panel from public website
  if (isAdminRoute) {
    return <AdminDashboard onNavigate={navigate} />;
  }

  // Lightweight branded welcome screen for first-time session entry
  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
        <div className="max-w-xs sm:max-w-sm space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-stone-900 border border-amber-600/40 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-stone-950">
            <span className="font-serif font-bold text-2xl sm:text-3xl text-amber-500 tracking-wider">
              F
            </span>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-widest uppercase text-stone-100">
              Welcome to FAWNIC
            </h1>
            <p className="text-xs uppercase tracking-widest text-amber-500/90 font-mono">
              Bespoke Leather Atelier • Pakistan
            </p>
          </div>
          <div className="w-28 h-0.5 bg-stone-850 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 origin-left animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Maintenance mode handling for public boutique
  if (storeSettings?.maintenanceMode) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-amber-600/20 border border-amber-500/40 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-serif font-bold shadow-xl shadow-amber-950/50">
            F
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-bold tracking-widest uppercase text-stone-100">
              FAWNIC
            </h1>
            <p className="text-xs uppercase tracking-widest text-amber-500 font-mono">
              Bespoke Leather Atelier
            </p>
          </div>
          <div className="w-16 h-px bg-amber-600/40 mx-auto" />
          <p className="font-serif text-stone-300 text-lg leading-relaxed italic">
            "FAWNIC Atelier is currently updating the private collection. We will be back shortly."
          </p>
          <div className="pt-6 border-t border-stone-850 text-xs text-stone-400 space-y-1.5 font-mono">
            <p>Direct Concierge: 03711661611</p>
            <p>Private Enquiries: fawnic1@gmail.com</p>
            <p className="text-stone-500">Lahore, Punjab, Pakistan</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950 text-stone-900 dark:text-stone-100 font-sans transition-colors duration-200">
      <Navbar
        onNavigate={navigate}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1">
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </main>

      <Footer onNavigate={navigate} />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onNavigate={navigate}
      />

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <MainApp />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
