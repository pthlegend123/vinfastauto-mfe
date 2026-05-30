import { useSyncExternalStore } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import CarDetail from './pages/CarDetail';
import MyTestDrives from './pages/MyTestDrives';
import TestDriveDetail from './pages/TestDriveDetail';
import TestDriveBook from './pages/TestDriveBook';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import MaintenancePage from './pages/MaintenancePage';
import MyMaintenance from './pages/MyMaintenance';
import MaintenanceDetail from './pages/MaintenanceDetail';
import PaymentResult from './pages/PaymentResult';
import LoginModal from './components/LoginModal';
import TestDriveModal from './components/TestDriveModal';
import OrderModal from './components/OrderModal';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';

const subscribeToScroll = (onStoreChange: () => void) => {
  window.addEventListener('scroll', onStoreChange);
  return () => window.removeEventListener('scroll', onStoreChange);
};

const getScrollSnapshot = () => window.scrollY;
const getServerScrollSnapshot = () => 0;

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const scrollY = useSyncExternalStore(subscribeToScroll, getScrollSnapshot, getServerScrollSnapshot);
  const scrolled = isHomePage && scrollY > 50;

  return (
    <AuthProvider>
      <ModalProvider>
        <div className="app">
          <Header scrolled={scrolled} />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/car-detail/:productId" element={<CarDetail />} />
              <Route path="/test-drive-book/:productId" element={<TestDriveBook />} />
              <Route path="/my-test-drives" element={<MyTestDrives />} />
              <Route path="/my-test-drives/:testDriveCode" element={<TestDriveDetail />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/my-orders/:orderCode" element={<OrderDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/my-maintenance" element={<MyMaintenance />} />
              <Route path="/my-maintenance/:bookingCode" element={<MaintenanceDetail />} />
              <Route path="/payment-result" element={<PaymentResult />} />
            </Routes>
          </main>
          <Footer />
          <LoginModal />
          <TestDriveModal />
          <OrderModal />
        </div>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
