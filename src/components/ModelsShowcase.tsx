import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import type { Product } from '../types/product.types';
import { productService } from '../services/product.service';
import { sharedDataService } from '../services/shared-data.service';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import './ModelsShowcase.css';

export default function ModelsShowcase() {
  const navigate = useNavigate();
  const { isLoggedIn, openLoginModal } = useAuth();
  const { openOrderModal } = useModal();
  const [models, setModels] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Carousel Indices
  const [activeCarIndex, setActiveCarIndex] = useState(0);
  const [activeMotoIndex, setActiveMotoIndex] = useState(0);

  useEffect(() => {
    if (sharedDataService.hasFetchedProducts) {
      setModels(sharedDataService.getProducts());
      setLoading(false);
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchModels = async () => {
      try {
        const responseData = await productService.getAllProducts();
        if (responseData.code === 200 && responseData.data?.content) {
          sharedDataService.setProducts(responseData.data.content);
          setModels(responseData.data.content);
        } else {
          setError(responseData.message || 'Lỗi khi tải dữ liệu sản phẩm');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi kết nối đến máy chủ');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const formatPrice = (price?: number) => {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getThumbnail = (product: Product) => {
    if (!product.variants) return '/images/vf_model_suv.png';
    for (const variant of product.variants) {
      if (!variant.skus) continue;
      for (const sku of variant.skus) {
        const thumb = sku.images?.find(img => img.isThumbnail);
        if (thumb) return thumb.imageUrl;
      }
    }
    return product.variants[0]?.skus?.[0]?.images?.[0]?.imageUrl || '/images/vf_model_suv.png';
  };

  const getLowestPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return null;
    const prices = product.variants.map(v => v.price).filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const getBestRange = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return null;
    const ranges = product.variants.map(v => v.rangePerCharge).filter(Boolean);
    return ranges.length > 0 ? Math.max(...ranges) : null;
  };

  const cars = models.filter(m => m.type === 'CAR');
  const motorcycles = models.filter(m => m.type === 'MOTORCYCLE');

  const handleNext = (items: Product[], currentIndex: number, setIndex: React.Dispatch<React.SetStateAction<number>>) => {
    setIndex((currentIndex + 1) % items.length);
  };

  const handlePrev = (items: Product[], currentIndex: number, setIndex: React.Dispatch<React.SetStateAction<number>>) => {
    setIndex((currentIndex - 1 + items.length) % items.length);
  };

  const renderHeroCarousel = (title: string, items: Product[], activeIndex: number, setIndex: React.Dispatch<React.SetStateAction<number>>) => {
    if (items.length === 0) return null;
    const product = items[activeIndex];
    const lowestPrice = getLowestPrice(product);
    const bestRange = getBestRange(product);

    return (
      <div className="hero-carousel-section">
        <div className="section-header-compact">
          <Zap size={18} />
          <h2>{title}</h2>
        </div>

        <div className="hero-carousel-container">
          {/* Background Big Text */}
          <div className="hero-bg-text">
            {product.name.toUpperCase()}
          </div>

          <div className="hero-main-view">
            {/* Nav Arrows */}
            <button className="nav-btn prev" onClick={() => handlePrev(items, activeIndex, setIndex)}>
              <ChevronLeft size={24} />
            </button>

            <div className="hero-image-wrapper">
              <img 
                src={getThumbnail(product)} 
                alt={product.name} 
                className="hero-image"
                key={product.productCode} // Force re-animation
              />
            </div>

            <button className="nav-btn next" onClick={() => handleNext(items, activeIndex, setIndex)}>
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Specs Row */}
          <div className="hero-spec-row">
            <div className="spec-block">
              <span className="spec-title">Dòng xe</span>
              <span className="spec-val">{product.type === 'CAR' ? 'Electric SUV' : 'Electric Scooter'}</span>
            </div>
            <div className="spec-block">
              <span className="spec-title">Số chỗ ngồi</span>
              <span className="spec-val">{product.carSpec?.seatingCapacity || 2} chỗ</span>
            </div>
            <div className="spec-block">
              <span className="spec-title">Quãng đường lên tới</span>
              <span className="spec-val">{bestRange ? `${bestRange} km (NEDC)` : 'Liên hệ'}</span>
            </div>
            <div className="spec-block">
              <span className="spec-title">Giá từ</span>
              <span className="spec-val">{lowestPrice ? formatPrice(lowestPrice) : 'Liên hệ'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="hero-actions">
            <button
              className="btn btn-hero-primary"
              onClick={() => {
                if (!isLoggedIn) {
                  openLoginModal(() => openOrderModal(product));
                } else {
                  openOrderModal(product);
                }
              }}
            >
              ĐẶT CỌC
            </button>
            <button
              className="btn btn-hero-outline"
              onClick={() => navigate(`/car-detail/${product.productCode}`, { state: { product } })}
            >
              XEM CHI TIẾT
            </button>
          </div>

          {/* Pagination Dots */}
          <div className="hero-dots">
            {items.map((_, idx) => (
              <span 
                key={idx} 
                className={`dot ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => setIndex(idx)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span>Đang tải danh sách xe...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section id="models-showcase" className="models-showcase hero-mode">
      <div id="cars">{renderHeroCarousel('Ô TÔ ĐIỆN', cars, activeCarIndex, setActiveCarIndex)}</div>
      <div className="section-divider" />
      <div id="ebikes">{renderHeroCarousel('XE MÁY ĐIỆN', motorcycles, activeMotoIndex, setActiveMotoIndex)}</div>
    </section>
  );
}


