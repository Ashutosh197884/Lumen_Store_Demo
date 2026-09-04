import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import { Loader } from './components/ui'
import StorefrontLayout from './layouts/StorefrontLayout'
import AdminLayout from './layouts/AdminLayout'

/* Storefront pages — loaded on demand */
const HomePage = lazy(() => import('./pages/HomePage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'))
const OrderPage = lazy(() => import('./pages/OrderPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

/* Admin pages — only fetched when someone opens /admin */
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'))
const ProductFormPage = lazy(() => import('./pages/admin/ProductFormPage'))
const InventoryPage = lazy(() => import('./pages/admin/InventoryPage'))
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage'))
const CustomersPage = lazy(() => import('./pages/admin/CustomersPage'))

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Customer storefront */}
          <Route element={<StorefrontLayout />}>
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="product/:id" element={<ProductPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="track" element={<TrackOrderPage />} />
            <Route path="order/:ref" element={<OrderPage />} />
          </Route>

          {/* Admin */}
          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:id/edit" element={<ProductFormPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="customers" element={<CustomersPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
          <Route path="/old" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}