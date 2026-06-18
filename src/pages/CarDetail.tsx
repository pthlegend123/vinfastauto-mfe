import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productService } from '../services/product.service';
import { sharedDataService } from '../services/shared-data.service';
import type { Product, ProductImage, ProductSku, ProductVariant } from '../types/product.types';
import { ArrowLeft, ChevronLeft, ChevronRight, Shield, Gauge, Users, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import './CarDetail.css';

const FALLBACK_CAR_IMAGE = '/images/vf_model_suv.png';

const getOrderedImages = (images?: ProductImage[]) =>
  [...(images ?? [])]
    .filter(image => Boolean(image.imageUrl))
    .sort((a, b) => (a.displayOrder - b.displayOrder) || (a.id - b.id));

const getDefaultImageIndex = (images: ProductImage[]) => {
  const thumbnailIndex = images.findIndex(image => image.isThumbnail);
  return thumbnailIndex >= 0 ? thumbnailIndex : 0;
};

export default function CarDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, openLoginModal } = useAuth();
  const { openOrderModal, openTestDriveModal } = useModal();

  const [product, setProduct] = useState<Product | null>(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [error, setError] = useState<string | null>(null);
  const [consultMessage, setConsultMessage] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const consultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // View state — drives image + color picker display
  const [viewVariant, setViewVariant] = useState<ProductVariant | null>(null);
  const [viewSku, setViewSku] = useState<ProductSku | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const selectViewSku = (sku: ProductSku | null) => {
    const skuImages = getOrderedImages(sku?.images);
    setViewSku(sku);
    setSelectedImageIndex(getDefaultImageIndex(skuImages));
  };

  // Init view state once product is available
  useEffect(() => {
    if (product && !viewVariant) {
      const first = product.variants?.[0] ?? null;
      setViewVariant(first);
      selectViewSku(first?.skus?.[0] ?? null);
    }
  }, [product, viewVariant]);

  const handleViewVariantSelect = (variant: ProductVariant) => {
    setViewVariant(variant);
    selectViewSku(variant.skus?.[0] ?? null);
  };

  const handleDeposit = () => {
    if (!product) return;
    if (!isLoggedIn) {
      openLoginModal(() => openOrderModal(product));
    } else {
      openOrderModal(product);
    }
  };

  const showConsultMessage = () => {
    if (consultTimerRef.current) clearTimeout(consultTimerRef.current);
    setConsultMessage('Cảm ơn bạn, tư vấn viên sẽ liên hệ trong thời gian sớm nhất.');
    consultTimerRef.current = setTimeout(() => setConsultMessage(null), 4000);
  };

  const handleConsult = () => {
    if (!isLoggedIn) {
      openLoginModal(showConsultMessage);
    } else {
      showConsultMessage();
    }
  };

  const handleTestDrive = () => {
    if (!isLoggedIn) {
      openLoginModal(() => openTestDriveModal(productId, viewVariant?.variantCode));
    } else {
      openTestDriveModal(productId, viewVariant?.variantCode);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) { navigate(-1); } else { navigate('/'); }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (product) return;
    if (!productId) return;

    if (sharedDataService.hasFetchedProducts) {
      const found = sharedDataService.getProductByCode(productId);
      if (found) { setProduct(found); } else { setError('Không tìm thấy thông tin sản phẩm'); }
      setLoading(false);
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await productService.getAllProducts();
        if (res.data?.content) {
          sharedDataService.setProducts(res.data.content);
          const found = sharedDataService.getProductByCode(productId);
          if (found) { setProduct(found); } else { setError('Không tìm thấy thông tin sản phẩm'); }
        } else { setError(res.message || 'Không tìm thấy thông tin sản phẩm'); }
      } catch (err) { setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ'); }
      finally { setLoading(false); }
    };
    fetchDetail();
  }, [productId, product]);

  useEffect(() => () => {
    if (consultTimerRef.current) clearTimeout(consultTimerRef.current);
  }, []);

  if (loading) {
    return (
      <div className="cd-loading">
        <div className="cd-spinner" />
        <p>Đang tải thông tin xe...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="cd-error">
        <h2>{error || 'Không tìm thấy xe'}</h2>
        <button className="cd-btn-primary" onClick={() => navigate('/')}>Quay lại trang chủ</button>
      </div>
    );
  }

  const formatPrice = (price?: number) =>
    price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price) : 'Liên hệ';

  const getLowestPrice = (p: Product) => {
    const prices = p.variants?.map(v => v.price).filter(Boolean) ?? [];
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const getFallbackDisplayImage = () => {
    for (const v of product.variants ?? []) {
      for (const s of v.skus ?? []) {
        const images = getOrderedImages(s.images);
        const thumbnail = images.find(image => image.isThumbnail);
        if (thumbnail) return thumbnail.imageUrl;
        if (images[0]) return images[0].imageUrl;
      }
    }
    return FALLBACK_CAR_IMAGE;
  };

  const selectedSkuImages = getOrderedImages(viewSku?.images);

  const handleGalleryMove = (direction: -1 | 1) => {
    const totalImages = selectedSkuImages.length;
    if (totalImages <= 1) return;
    setSelectedImageIndex(current => (current + direction + totalImages) % totalImages);
  };

  const lowestPrice = getLowestPrice(product);
  const displayImage = selectedSkuImages[selectedImageIndex]?.imageUrl || getFallbackDisplayImage();
  const hasGalleryControls = selectedSkuImages.length > 1;
  const viewSkus = viewVariant?.skus ?? [];
  const selectedPrice = viewVariant?.price ?? lowestPrice ?? undefined;
  const selectedStockLabel = viewSku
    ? viewSku.stockQuantity > 0
      ? `Còn ${viewSku.stockQuantity} xe`
      : 'Hết hàng'
    : 'Chưa chọn màu';

  return (
    <div className="cd-page">
      {/* Sticky top bar */}
      <div className="cd-topbar">
        <button className="cd-back" onClick={handleBack}>
          <ArrowLeft size={18} /> Quay lại
        </button>
        <span className="cd-topbar-name">{product.name}</span>
      </div>

      {/* ── Hero: image (left dark) + info (right white) ── */}
      <section className="cd-hero">
        {/* Left: car image + color picker */}
        <div className="cd-image-panel">
          <div className="cd-image-stage">
            {hasGalleryControls && (
              <button
                type="button"
                className="cd-gallery-nav cd-gallery-nav--prev"
                onClick={() => handleGalleryMove(-1)}
                aria-label="Xem ảnh trước"
              >
                <ChevronLeft size={30} />
              </button>
            )}
            <img
              key={`${viewSku?.sku ?? 'default'}-${selectedImageIndex}`}
              src={displayImage}
              alt={product.name}
              className="cd-main-img"
            />
            {hasGalleryControls && (
              <button
                type="button"
                className="cd-gallery-nav cd-gallery-nav--next"
                onClick={() => handleGalleryMove(1)}
                aria-label="Xem ảnh tiếp theo"
              >
                <ChevronRight size={30} />
              </button>
            )}
          </div>

          {viewSkus.length > 0 && (
            <div className="cd-colors">
              <span className="cd-color-label">
                {viewSku?.color?.colorName ?? 'Chọn màu'}
              </span>
              <div className="cd-swatch-row">
                {viewSkus.map(sku => (
                  <button
                    key={sku.sku}
                    className={`cd-swatch${viewSku?.sku === sku.sku ? ' active' : ''}`}
                    style={{ backgroundColor: sku.color?.colorHex ?? '#ccc' }}
                    title={sku.color?.colorName}
                    onClick={() => selectViewSku(sku)}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedSkuImages.length > 1 && (
            <div className="cd-gallery-thumbs" aria-label="Ảnh của màu đang chọn">
              {selectedSkuImages.map((image, index) => (
                <button
                  type="button"
                  key={image.id}
                  className={`cd-gallery-thumb${selectedImageIndex === index ? ' active' : ''}`}
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`Xem ảnh ${index + 1}`}
                  aria-current={selectedImageIndex === index ? 'true' : undefined}
                >
                  <img src={image.imageUrl} alt={`${product.name} ${viewSku?.color?.colorName ?? ''} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: product info */}
        <div className="cd-info-panel">
          <span className="cd-badge">
            {product.type === 'CAR' ? 'Ô TÔ ĐIỆN' : 'XE MÁY ĐIỆN'}
          </span>
          <h1 className="cd-name">{product.name}</h1>
          <p className="cd-desc">{product.description}</p>

          {/* Variant tabs */}
          {product.variants && product.variants.length > 1 && (
            <div className="cd-variant-tabs">
              <span className="cd-label-sm">Phiên bản</span>
              <div className="cd-tab-row">
                {product.variants.map(v => (
                  <button
                    key={v.variantCode}
                    className={`cd-tab${viewVariant?.variantCode === v.variantCode ? ' active' : ''}`}
                    onClick={() => handleViewVariantSelect(v)}
                  >
                    {v.variantName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inline specs chips */}
          {viewVariant && (
            <div className="cd-chips">
              <span className="cd-chip"><Zap size={13} /> {viewVariant.batteryCapacity || 'N/A'}</span>
              <span className="cd-chip">⚡ {viewVariant.rangePerCharge ? `${viewVariant.rangePerCharge} km NEDC` : 'N/A'}</span>
            </div>
          )}

          {/* Price */}
          <div className="cd-price-block">
            <span className="cd-price-label">Giá phiên bản đang chọn</span>
            <span className="cd-price">{selectedPrice ? formatPrice(selectedPrice) : 'Liên hệ'}</span>
          </div>

          <div className="cd-purchase-summary">
            <div>
              <span>Phiên bản</span>
              <strong>{viewVariant?.variantName ?? 'Chưa chọn'}</strong>
            </div>
            <div>
              <span>Màu sắc</span>
              <strong>{viewSku?.color?.colorName ?? 'Chưa chọn'}</strong>
            </div>
            <div>
              <span>Tình trạng</span>
              <strong className={viewSku?.stockQuantity ? 'cd-stock-ok' : 'cd-stock-out'}>
                {selectedStockLabel}
              </strong>
            </div>
          </div>

          {consultMessage && (
            <div className="cd-inline-success" role="status">
              {consultMessage}
            </div>
          )}

          {/* Actions */}
          <div className="cd-actions">
            <button className="cd-btn-primary" onClick={handleDeposit}>
              ĐẶT CỌC NGAY
            </button>
            <button className="cd-btn-secondary" onClick={handleTestDrive}>
              ĐĂNG KÝ LÁI THỬ
            </button>
            <button className="cd-btn-ghost" onClick={handleConsult}>
              NHẬN TƯ VẤN
            </button>
          </div>
        </div>
      </section>

      {/* ── Key specs ── */}
      {(product.carSpec?.seatingCapacity || product.carSpec?.adasLevel || product.carSpec?.drivetrain || product.carSpec?.airbags) && (
        <section className="cd-specs-section">
          <h2 className="cd-section-title">Thông số nổi bật</h2>
          <div className="cd-specs-grid">
            {product.carSpec?.seatingCapacity && (
              <div className="cd-spec-card">
                <Users size={28} className="cd-spec-icon" />
                <span className="cd-spec-val">{product.carSpec.seatingCapacity}</span>
                <span className="cd-spec-lbl">Chỗ ngồi</span>
              </div>
            )}
            {product.carSpec?.adasLevel && (
              <div className="cd-spec-card">
                <Shield size={28} className="cd-spec-icon" />
                <span className="cd-spec-val">{product.carSpec.adasLevel}</span>
                <span className="cd-spec-lbl">Mức ADAS</span>
              </div>
            )}
            {product.carSpec?.drivetrain && (
              <div className="cd-spec-card">
                <Gauge size={28} className="cd-spec-icon" />
                <span className="cd-spec-val">{product.carSpec.drivetrain}</span>
                <span className="cd-spec-lbl">Hệ dẫn động</span>
              </div>
            )}
            {product.carSpec?.airbags !== undefined && product.carSpec.airbags > 0 && (
              <div className="cd-spec-card">
                <Shield size={28} className="cd-spec-icon" />
                <span className="cd-spec-val">{product.carSpec.airbags}</span>
                <span className="cd-spec-lbl">Túi khí</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Variants comparison ── */}
      {product.variants && product.variants.length > 0 && (
        <section className="cd-variants-section">
          <h2 className="cd-section-title">So sánh phiên bản</h2>
          <div className="cd-variants-grid">
            {product.variants.map(variant => (
              <div
                key={variant.variantCode}
                className={`cd-variant-card${viewVariant?.variantCode === variant.variantCode ? ' active' : ''}`}
              >
                <div className="cd-variant-header">
                  <h3>{variant.variantName}</h3>
                  <span className="cd-variant-price">{formatPrice(variant.price)}</span>
                </div>
                <div className="cd-variant-row">
                  <span>Pin</span>
                  <strong>{variant.batteryCapacity || 'N/A'}</strong>
                </div>
                <div className="cd-variant-row">
                  <span>Quãng đường</span>
                  <strong>{variant.rangePerCharge ? `${variant.rangePerCharge} km` : 'N/A'}</strong>
                </div>
                {variant.skus && variant.skus.length > 0 && (
                  <div className="cd-variant-colors">
                    <span>Màu sắc</span>
                    <div className="cd-variant-swatches">
                      {variant.skus
                        .filter((s, i, a) => s.color && a.findIndex(x => x.color?.colorCode === s.color?.colorCode) === i)
                        .map(s => (
                          <span
                            key={s.color?.colorCode}
                            className="cd-mini-swatch"
                            style={{ backgroundColor: s.color?.colorHex ?? '#ccc' }}
                            title={s.color?.colorName}
                          />
                        ))}
                    </div>
                  </div>
                )}
                <button
                  className="cd-variant-view-btn"
                  onClick={() => handleViewVariantSelect(variant)}
                >
                  Xem phiên bản này
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
