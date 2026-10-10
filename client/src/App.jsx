import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { MainLayout } from './layouts/MainLayout';

import { CustomerDashboard } from './pages/CustomerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProductsPage } from './pages/ProductsPage';
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

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchValue, setSearchValue] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isStorefrontPreview, setIsStorefrontPreview] = useState(false);

  // Signals to open creation modals on Products or Categories pages from Dashboard shortcuts
  const [openAddProductSignal, setOpenAddProductSignal] = useState(false);
  const [openAddCategorySignal, setOpenAddCategorySignal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-10 h-10 border-4 border-navy border-t-teal rounded-full animate-spin"></div>
        <p className="text-xs font-extrabold text-navy tracking-tight">Initializing ShopFlow...</p>
      </div>
    );
  }

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setActiveTab('orders');
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategoryId(categoryId || '');
    setActiveTab('products');
  };

  const handleShortcutAddProduct = () => {
    setActiveTab('products');
    setOpenAddProductSignal(true);
  };

  const handleShortcutAddCategory = () => {
    setActiveTab('categories');
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
        onClick={() => setActiveTab('dashboard')}
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
            setActiveTab={setActiveTab}
            onSelectOrder={handleSelectOrder}
            onOpenAddProduct={handleShortcutAddProduct}
            onOpenAddCategory={handleShortcutAddCategory}
          />
        ) : (
          <CustomerDashboard
            setActiveTab={setActiveTab}
            onSelectOrder={handleSelectOrder}
            onSelectCategory={handleSelectCategory}
          />
        );

      case 'products':
        return (
          <ProductsPage
            globalSearch={searchValue}
            initialCategory={selectedCategoryId}
            openAddModalSignal={openAddProductSignal}
            onModalHandled={() => setOpenAddProductSignal(false)}
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
            setActiveTab={setActiveTab}
            onOrderPlaced={(newOrderId) => {
              setSelectedOrderId(newOrderId);
              setActiveTab('orders');
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
          <AuthPage onSuccessRedirect={() => setActiveTab('profile')} />
        );

      case 'login':
      case 'register':
        return <AuthPage onSuccessRedirect={() => setActiveTab('dashboard')} />;

      default:
        return isAdmin && !isStorefrontPreview ? (
          <AdminDashboard
            setActiveTab={setActiveTab}
            onSelectOrder={handleSelectOrder}
            onOpenAddProduct={handleShortcutAddProduct}
            onOpenAddCategory={handleShortcutAddCategory}
          />
        ) : (
          <CustomerDashboard
            setActiveTab={setActiveTab}
            onSelectOrder={handleSelectOrder}
            onSelectCategory={handleSelectCategory}
          />
        );
    }
  };

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
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
