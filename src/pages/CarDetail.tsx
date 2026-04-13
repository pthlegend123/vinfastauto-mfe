import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productService } from '../services/product.service';
import { sharedDataService } from '../services/shared-data.service';
import { orderService } from '../services/order.service';
import type { Product, ProductSku, ProductVariant } from '../types/product.types';
import { ArrowLeft, Shield, Gauge, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './CarDetail.css';

export default function CarDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, openLoginModal } = useAuth();

  const [product, setProduct] = useState<Product | null>(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Order modal state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const openOrderModal = () => {
    if (!product) return;
    const firstVariant = product.variants?.[0] ?? null;
    setSelectedVariant(firstVariant);
    setSelectedSku(firstVariant?.skus?.[0] ?? null);
    setDepositAmount(
      firstVariant?.price ? String(Math.round(firstVariant.price * 0.1)) : ''
    );
    setOrderNote('');
    setOrderError(null);
    setOrderModalOpen(true);
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setSelectedSku(variant.skus?.[0] ?? null);
    setDepositAmount(variant.price ? String(Math.round(variant.price * 0.1)) : '');
  };

  const handleOrderSubmit = async () => {
    if (!selectedSku) {
      setOrderError('Vui lòng chọn màu sắc.');
      return;
    }
    const deposit = Number(depositAmount);
    if (!depositAmount || isNaN(deposit) || deposit <= 0) {
      setOrderError('Vui lòng nhập số tiền đặt cọc hợp lệ.');
      return;
    }
    setOrderLoading(true);
    setOrderError(null);
    try {
      const res = await orderService.createOrder({
        skuCode: selectedSku.sku,
        depositAmount: deposit,
        note: orderNote || undefined,
      });
      if (res.code === 200 && res.data) {
        setOrderModalOpen(false);
        navigate('/my-orders');
      } else {
        setOrderError(res.message || 'Đặt cọc thất bại. Vui lòng thử lại.');
      }
    } catch {
      setOrderError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleDeposit = () => {
    if (!isLoggedIn) {
      openLoginModal(openOrderModal);
    } else {
      openOrderModal();
    }
  };

  const handleConsult = () => {
    if (!isLoggedIn) {
      openLoginModal(() => alert('Chúng tôi sẽ liên hệ tư vấn cho bạn.'));
    } else {
      alert('Chúng tôi sẽ liên hệ tư vấn cho bạn.');
    }
  };

  const handleTestDrive = () => {
    if (!isLoggedIn) {
      openLoginModal(() => {
        navigate(`/test-drive-book/${productId}`);
      });
    } else {
      navigate(`/test-drive-book/${productId}`);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (product) return;
    if (!productId) return;

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

    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const responseData = await productService.getAllProducts();
        if (responseData.code === 200 && responseData.data?.content) {
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

  const getLowestPrice = (p: Product) => {
    if (!p.variants || p.variants.length === 0) return null;
    const prices = p.variants.map(v => v.price).filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const getThumbnail = (p: Product) => {
    if (!p.variants) return '/images/vf_model_suv.png';
    for (const variant of p.variants) {
      if (!variant.skus) continue;
      for (const sku of variant.skus) {
        const thumb = sku.images?.find(img => img.isThumbnail);
        if (thumb) return thumb.imageUrl;
      }
    }
    const firstImage = p.variants[0]?.skus?.[0]?.images?.[0]?.imageUrl;
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
            <button className="btn btn-outline" onClick={handleTestDrive}>LÁI THỬ</button>
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
              <div key={variant.variantCode} className="variant-card">
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

      {/* Order (Deposit) Modal */}
      {orderModalOpen && (
        <div className="order-modal-overlay" onClick={() => setOrderModalOpen(false)}>
          <div className="order-modal" onClick={e => e.stopPropagation()}>
            <div className="order-modal-header">
              <h2>Đặt cọc xe {product.name}</h2>
              <button className="order-modal-close" onClick={() => setOrderModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="order-modal-body">
              {product.variants && product.variants.length > 0 && (
                <div className="order-field">
                  <label>Chọn phiên bản</label>
                  <div className="order-variant-list">
                    {product.variants.map(variant => (
                      <button
                        key={variant.variantCode}
                        className={`order-variant-btn${selectedVariant?.variantCode === variant.variantCode ? ' selected' : ''}`}
                        onClick={() => handleVariantSelect(variant)}
                      >
                        <span className="order-variant-name">{variant.variantName}</span>
                        <span className="order-variant-price">{formatPrice(variant.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedVariant?.skus && selectedVariant.skus.length > 0 && (
                <div className="order-field">
                  <label>Chọn màu sắc</label>
                  <div className="order-sku-list">
                    {selectedVariant.skus.map(sku => (
                      <button
                        key={sku.sku}
                        className={`order-sku-btn${selectedSku?.sku === sku.sku ? ' selected' : ''}`}
                        onClick={() => setSelectedSku(sku)}
                        title={sku.color?.colorName}
                      >
                        <span
                          className="order-color-swatch"
                          style={{ backgroundColor: sku.color?.colorHex || '#ccc' }}
                        />
                        <span>{sku.color?.colorName || 'Không rõ'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="order-field">
                <label>Số tiền đặt cọc (VND)</label>
                <input
                  type="number"
                  className="order-input"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="Nhập số tiền đặt cọc"
                  min={1}
                />
                {selectedVariant?.price && (
                  <span className="order-deposit-hint">
                    Gợi ý: {formatPrice(Math.round(selectedVariant.price * 0.1))} (10% giá xe)
                  </span>
                )}
              </div>

              <div className="order-field">
                <label>Ghi chú (tuỳ chọn)</label>
                <textarea
                  className="order-input"
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  placeholder="Ghi chú thêm cho đơn hàng..."
                  rows={3}
                />
              </div>

              {orderError && <p className="order-error">{orderError}</p>}
            </div>

            <div className="order-modal-footer">
              <button className="btn btn-outline" onClick={() => setOrderModalOpen(false)} disabled={orderLoading}>
                Huỷ
              </button>
              <button className="btn btn-primary" onClick={handleOrderSubmit} disabled={orderLoading}>
                {orderLoading ? 'Đang xử lý...' : 'Xác nhận đặt cọc'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
