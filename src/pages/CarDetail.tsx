import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productService } from '../services/product.service';
import { sharedDataService } from '../services/shared-data.service';
import type { Product } from '../types/product.types';
import { ArrowLeft, Shield, Gauge, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './CarDetail.css';

export default function CarDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, openLoginModal } = useAuth();

  const handleDeposit = () => {
    if (!isLoggedIn) {
      openLoginModal(() => alert('Vui lòng điền thông tin đặt cọc.'));
    } else {
      alert('Vui lòng điền thông tin đặt cọc.');
    }
  };

  const handleConsult = () => {
    if (!isLoggedIn) {
      openLoginModal(() => alert('Chúng tôi sẽ liên hệ tư vấn cho bạn.'));
    } else {
      alert('Chúng tôi sẽ liên hệ tư vấn cho bạn.');
    }
  };
  const [product, setProduct] = useState<Product | null>(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (product) return; // Already have product from location state
    if (!productId) return;

    // Fast path: Check our shared data service first
    if (sharedDataService.hasFetchedProducts) {
      const foundProduct = sharedDataService.getProductByCode(productId);
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        setError('Không tìm thấy thông tin sản phẩm');
      }
      setLoading(false);
      return;
    }

    // Prevent double call caused by React.StrictMode in development
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        // Fallback: fetch all products and find the matching one
        const responseData = await productService.getAllProducts();
        if (responseData.code === 200 && responseData.data?.content) {
          // Save to shared data service so other components can benefit
          sharedDataService.setProducts(responseData.data.content);
          
          const foundProduct = sharedDataService.getProductByCode(productId);
          if (foundProduct) {
            setProduct(foundProduct);
          } else {
            setError('Không tìm thấy thông tin sản phẩm');
          }
        } else {
          setError(responseData.message || 'Không tìm thấy thông tin sản phẩm');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [productId, product]);

  if (loading) {
    return (
      <div className="car-detail-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin xe...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="car-detail-error">
        <h2>{error || 'Không tìm thấy xe'}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Quay lại trang chủ</button>
      </div>
    );
  }

  const formatPrice = (price?: number) => {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getLowestPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return null;
    const prices = product.variants.map(v => v.price).filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : null;
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
    const firstImage = product.variants[0]?.skus?.[0]?.images?.[0]?.imageUrl;
    return firstImage || '/images/vf_model_suv.png';
  };

  const lowestPrice = getLowestPrice(product);

  return (
    <div className="car-detail-page">
      <div className="car-detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} /> Quay lại
        </button>
      </div>

      <div className="car-detail-hero">
        <div className="car-detail-image">
           <img 
              src={getThumbnail(product)}
              alt={product.name} 
           />
        </div>
        
        <div className="car-detail-info">
          <span className="car-type-badge">{product.type === 'CAR' ? 'Ô TÔ ĐIỆN' : 'XE MÁY ĐIỆN'}</span>
          <h1 className="car-title">{product.name}</h1>
          <p className="car-desc">{product.description}</p>
          
          <div className="car-price-block">
            <span className="price-label">Giá từ</span>
            <span className="price-value">{lowestPrice ? formatPrice(lowestPrice) : 'Liên hệ'}</span>
          </div>

          <div className="car-action-buttons">
             <button className="btn btn-primary" onClick={handleDeposit}>ĐẶT CỌC NGAY</button>
             <button className="btn btn-outline" onClick={handleConsult}>NHẬN TƯ VẤN</button>
          </div>
        </div>
      </div>

      <div className="car-specs-section">
        <h2>Thông số kỹ thuật nổi bật</h2>
        <div className="specs-grid">
          {product.carSpec?.seatingCapacity && (
            <div className="spec-item">
              <Users size={32} />
              <div className="spec-text">
                <span className="spec-val">{product.carSpec.seatingCapacity}</span>
                <span className="spec-lbl">Chỗ ngồi</span>
              </div>
            </div>
          )}
          {product.carSpec?.adasLevel && (
            <div className="spec-item">
              <Shield size={32} />
              <div className="spec-text">
                <span className="spec-val">{product.carSpec.adasLevel}</span>
                <span className="spec-lbl">Mức độ ADAS</span>
              </div>
            </div>
          )}
          {product.carSpec?.drivetrain && (
             <div className="spec-item">
              <Gauge size={32} />
              <div className="spec-text">
                <span className="spec-val">{product.carSpec.drivetrain}</span>
                <span className="spec-lbl">Hệ dẫn động</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {product.variants && product.variants.length > 0 && (
        <div className="car-variants-section">
          <h2>Các phiên bản</h2>
          <div className="variants-list">
            {product.variants.map(variant => (
              <div key={variant.id} className="variant-card">
                <h3>{variant.variantName}</h3>
                <p className="variant-price">{formatPrice(variant.price)}</p>
                <div className="variant-details">
                  <span>Pin: {variant.batteryCapacity || 'N/A'}</span>
                  <span>Quãng đường: {variant.rangePerCharge ? `${variant.rangePerCharge} km` : 'N/A'}</span>
                </div>
                {variant.skus && variant.skus.length > 0 && (
                  <div className="variant-colors">
                    Màu sắc: 
                    <div className="color-dots">
                      {variant.skus
                         .map(s => s.color)
                         .filter((v, i, a) => v && a.findIndex(t => t?.colorCode === v?.colorCode) === i)
                         .map(c => (
                        <span key={c?.colorCode} className="color-dot" style={{ backgroundColor: c?.colorHex || '#ccc' }} title={c?.colorName}></span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
