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
import { AuthPage } from './pages/AuthPage';

function AppContent() {
  const { user, isAdmin, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchValue, setSearchValue] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Signals to open creation modals on Products or Categories pages from Dashboard shortcuts
  const [openAddProductSignal, setOpenAddProductSignal] = useState(false);
  const [openAddCategorySignal, setOpenAddCategorySignal] = useState(false);

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setActiveTab('orders');
  };

  const handleShortcutAddProduct = () => {
    setActiveTab('products');
    setOpenAddProductSignal(true);
  };

  const handleShortcutAddCategory = () => {
    setActiveTab('categories');
    setOpenAddCategorySignal(true);
  };

  // Render appropriate view based on activeTab and user permissions
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return isAdmin ? (
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
          />
        );

      case 'products':
        return (
          <ProductsPage
            globalSearch={searchValue}
            openAddModalSignal={openAddProductSignal}
            onModalHandled={() => setOpenAddProductSignal(false)}
          />
        );

      case 'categories':
        return isAdmin ? (
          <CategoriesPage
            openAddModalSignal={openAddCategorySignal}
            onModalHandled={() => setOpenAddCategorySignal(false)}
          />
        ) : (
          <CustomerDashboard setActiveTab={setActiveTab} onSelectOrder={handleSelectOrder} />
        );

      case 'inventory':
        return isAdmin ? (
          <InventoryPage />
        ) : (
          <CustomerDashboard setActiveTab={setActiveTab} onSelectOrder={handleSelectOrder} />
        );

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
        return isAdmin ? (
          <CustomersPage />
        ) : (
          <CustomerDashboard setActiveTab={setActiveTab} onSelectOrder={handleSelectOrder} />
        );

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
        return (
          <CustomerDashboard
            setActiveTab={setActiveTab}
            onSelectOrder={handleSelectOrder}
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
