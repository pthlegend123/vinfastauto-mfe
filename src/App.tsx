import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import CarDetail from './pages/CarDetail';
import TestDriveBook from './pages/TestDriveBook';
import MyTestDrives from './pages/MyTestDrives';
import TestDriveDetail from './pages/TestDriveDetail';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import LoginModal from './components/LoginModal';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AuthProvider>
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
          </Routes>
        </main>
        <Footer />
        <LoginModal />
      </div>
    </AuthProvider>
  );
}

export default App;
