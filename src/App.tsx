import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ModelsShowcase from './components/ModelsShowcase';
import Promotions from './components/Promotions';
import Footer from './components/Footer';

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
    <div className="app">
      <Header scrolled={scrolled} />
      <main>
        <Hero />
        <ModelsShowcase />
        <Promotions />
      </main>
      <Footer />
    </div>
  );
}

export default App;
