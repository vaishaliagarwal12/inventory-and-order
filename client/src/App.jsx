import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { MainLayout } from './layouts/MainLayout';

import { CustomerDashboard } from './pages/CustomerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { InventoryPage } from './pages/InventoryPage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReportsPage } from './pages/ReportsPage';
import { AuthPage } from './pages/AuthPage';

function AppContent() {
  const { user, isAdmin, isAuthenticated, isLoading } = useAuth();

  const parseLocation = () => {
    try {
      const pathname = window.location.pathname;
      const productMatch = pathname.match(/^\/products\/(\d+)$/);
      if (productMatch) {
        return { tab: 'product-detail', productId: Number(productMatch[1]) };
      }
      const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
      if (!cleanPath || cleanPath === 'dashboard' || cleanPath === 'home') {
        return { tab: 'dashboard', productId: null };
      }
      const knownTabs = [
        'products',
        'categories',
        'inventory',
        'cart',
        'orders',
        'customers',
        'reports',
        'profile',
        'login',
        'register'
      ];
      if (knownTabs.includes(cleanPath)) {
        return { tab: cleanPath, productId: null };
      }
      return { tab: 'dashboard', productId: null };
    } catch {
      return { tab: 'dashboard', productId: null };
    }
  };

  const initialRoute = parseLocation();
  const [activeTab, setActiveTabState] = useState(initialRoute.tab);
  const [selectedProductId, setSelectedProductId] = useState(initialRoute.productId);
  const [searchValue, setSearchValue] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isStorefrontPreview, setIsStorefrontPreview] = useState(false);

  // Signals to open creation modals on Products or Categories pages from Dashboard shortcuts
  const [openAddProductSignal, setOpenAddProductSignal] = useState(false);
  const [openAddCategorySignal, setOpenAddCategorySignal] = useState(false);

  // Sync browser popstate (Back/Forward navigation) - called unconditionally on every render
  useEffect(() => {
    const handlePopState = () => {
      const route = parseLocation();
      setActiveTabState(route.tab);
      setSelectedProductId(route.productId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-10 h-10 border-4 border-navy border-t-teal rounded-full animate-spin"></div>
        <p className="text-xs font-extrabold text-navy tracking-tight">Initializing ShopFlow...</p>
      </div>
    );
  }

  const navigateTo = (tab, param = null) => {
    if (tab === 'product-detail' || (tab === 'products' && param)) {
      const prodId = Number(param || selectedProductId);
      setSelectedProductId(prodId);
      setActiveTabState('product-detail');
      if (window.location.pathname !== `/products/${prodId}`) {
        window.history.pushState(null, '', `/products/${prodId}`);
      }
    } else {
      setActiveTabState(tab);
      setSelectedProductId(null);
      const newPath = tab === 'dashboard' ? '/' : `/${tab}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, '', newPath);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (productId) => {
    navigateTo('product-detail', productId);
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    navigateTo('orders');
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategoryId(categoryId || '');
    navigateTo('products');
  };

  const handleShortcutAddProduct = () => {
    navigateTo('products');
    setOpenAddProductSignal(true);
  };

  const handleShortcutAddCategory = () => {
    navigateTo('categories');
    setOpenAddCategorySignal(true);
  };

  const renderAccessDenied = () => (
    <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl max-w-md mx-auto my-12 space-y-4 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-500 font-black text-lg">
        !
      </div>
      <h3 className="text-lg font-bold text-navy">Access Restricted</h3>
      <p className="text-xs text-slate-500 leading-relaxed">
        Administrative privileges are required to access this operational view.
      </p>
      <button
        onClick={() => navigateTo('dashboard')}
        className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-dark transition-all cursor-pointer"
      >
        Return to Home
      </button>
    </div>
  );

  // Render appropriate view based on activeTab and user permissions
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return isAdmin && !isStorefrontPreview ? (
          <AdminDashboard
            setActiveTab={navigateTo}
            onSelectOrder={handleSelectOrder}
            onOpenAddProduct={handleShortcutAddProduct}
            onOpenAddCategory={handleShortcutAddCategory}
          />
        ) : (
          <CustomerDashboard
            setActiveTab={navigateTo}
            onSelectOrder={handleSelectOrder}
            onSelectCategory={handleSelectCategory}
            onSelectProduct={handleSelectProduct}
          />
        );

      case 'products':
        return (
          <ProductsPage
            globalSearch={searchValue}
            initialCategory={selectedCategoryId}
            openAddModalSignal={openAddProductSignal}
            onModalHandled={() => setOpenAddProductSignal(false)}
            onSelectProduct={handleSelectProduct}
          />
        );

      case 'product-detail':
        return (
          <ProductDetailPage
            productId={selectedProductId}
            onBack={() => navigateTo('products')}
            setActiveTab={navigateTo}
            onSelectCategory={handleSelectCategory}
          />
        );

      case 'categories':
        return (
          <CategoriesPage
            openAddModalSignal={openAddCategorySignal}
            onModalHandled={() => setOpenAddCategorySignal(false)}
            onSelectCategory={handleSelectCategory}
          />
        );

      case 'inventory':
        return isAdmin ? <InventoryPage /> : renderAccessDenied();

      case 'cart':
        return (
          <CartPage
            setActiveTab={navigateTo}
            onSelectProduct={handleSelectProduct}
            onOrderPlaced={(newOrderId) => {
              setSelectedOrderId(newOrderId);
              navigateTo('orders');
            }}
          />
        );

      case 'orders':
        return (
          <OrdersPage
            selectedOrderId={selectedOrderId}
            onOrderCleared={() => setSelectedOrderId(null)}
          />
        );

      case 'customers':
        return isAdmin ? <CustomersPage /> : renderAccessDenied();

      case 'reports':
        return isAdmin ? <ReportsPage /> : renderAccessDenied();

      case 'profile':
        return isAuthenticated ? (
          <ProfilePage />
        ) : (
          <AuthPage onSuccessRedirect={() => navigateTo('profile')} />
        );

      case 'login':
      case 'register':
        return <AuthPage onSuccessRedirect={() => navigateTo('dashboard')} />;

      default:
        return isAdmin && !isStorefrontPreview ? (
          <AdminDashboard
            setActiveTab={navigateTo}
            onSelectOrder={handleSelectOrder}
            onOpenAddProduct={handleShortcutAddProduct}
            onOpenAddCategory={handleShortcutAddCategory}
          />
        ) : (
          <CustomerDashboard
            setActiveTab={navigateTo}
            onSelectOrder={handleSelectOrder}
            onSelectCategory={handleSelectCategory}
            onSelectProduct={handleSelectProduct}
          />
        );
    }
  };

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={navigateTo}
      searchValue={searchValue}
      setSearchValue={setSearchValue}
      isStorefrontPreview={isStorefrontPreview}
      onToggleStorefrontPreview={setIsStorefrontPreview}
    >
      {renderActiveView()}
    </MainLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <CurrencyProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </CurrencyProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
