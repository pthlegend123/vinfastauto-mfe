import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/Hero';
import ModelsShowcase from '../components/ModelsShowcase';
import Promotions from '../components/Promotions';

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (!state?.scrollTo) return;
    const timer = setTimeout(() => {
      document.getElementById(state.scrollTo!)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [location.state]);

  return (
    <>
      <Hero />
      <ModelsShowcase />
      <Promotions />
    </>
  );
}
