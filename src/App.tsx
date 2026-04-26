import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import CarDetail from './pages/CarDetail';
import MyTestDrives from './pages/MyTestDrives';
import TestDriveDetail from './pages/TestDriveDetail';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import MaintenancePage from './pages/MaintenancePage';
import MyMaintenance from './pages/MyMaintenance';
import MaintenanceDetail from './pages/MaintenanceDetail';
import LoginModal from './components/LoginModal';
import TestDriveModal from './components/TestDriveModal';
import OrderModal from './components/OrderModal';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';

function App() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    if (!isHomePage) {
      setScrolled(false);
      return;
    }
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  return (
    <AuthProvider>
      <ModalProvider>
        <div className="app">
          <Header scrolled={scrolled} />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/car-detail/:productId" element={<CarDetail />} />
              <Route path="/my-test-drives" element={<MyTestDrives />} />
              <Route path="/my-test-drives/:testDriveCode" element={<TestDriveDetail />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/my-orders/:orderCode" element={<OrderDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/my-maintenance" element={<MyMaintenance />} />
              <Route path="/my-maintenance/:bookingCode" element={<MaintenanceDetail />} />
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
