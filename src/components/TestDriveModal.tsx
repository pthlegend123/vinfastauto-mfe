import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { productService } from '../services/product.service';
import { testDriveService } from '../services/testDrive.service';
import { sharedDataService } from '../services/shared-data.service';
import { useModal } from '../context/ModalContext';
import type { Product } from '../types/product.types';
import type { TestDriveCreateRequest } from '../types/testDrive.types';
import './TestDriveModal.css';

interface FormState {
  productCode: string;
  variantCode: string;
  scheduledDate: string;
  location: string;
  expectedDurationMinutes: number;
  note: string;
}

const LOCATIONS = [
  'Hà Nội Showroom',
  'TP.HCM Showroom',
  'Đà Nẵng Showroom',
  'Cần Thơ Showroom',
];

function getMinDateTime(): string {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
}

export default function TestDriveModal() {
  const navigate = useNavigate();
  const { testDriveOpen, testDriveProductCode, testDriveVariantCode, closeTestDriveModal } = useModal();

  const isPickerMode = !testDriveProductCode;

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [formState, setFormState] = useState<FormState>({
    productCode: testDriveProductCode ?? '',
    variantCode: testDriveVariantCode ?? '',
    scheduledDate: '',
    location: LOCATIONS[0],
    expectedDurationMinutes: 30,
    note: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form and load products whenever modal opens
  useEffect(() => {
    if (!testDriveOpen) return;

    setSubmitError(null);
    setSuccessMessage(null);
    setSubmitting(false);
    setFormState({
      productCode: testDriveProductCode ?? '',
      variantCode: testDriveVariantCode ?? '',
      scheduledDate: '',
      location: LOCATIONS[0],
      expectedDurationMinutes: 30,
      note: '',
    });

    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        let list: Product[] = [];

        if (sharedDataService.hasFetchedProducts) {
          list = sharedDataService.getProducts();
        } else {
          const res = await productService.getAllProducts();
          if (res.data?.content) {
            sharedDataService.setProducts(res.data.content);
            list = res.data.content;
          }
        }

        setProducts(list);

        if (testDriveProductCode) {
          const found = list.find((p) => p.productCode === testDriveProductCode) ?? null;
          setSelectedProduct(found);
          if (found && !testDriveVariantCode && found.variants?.length > 0) {
            setFormState((prev) => ({ ...prev, variantCode: found.variants[0].variantCode }));
          }
        } else {
          setSelectedProduct(null);
        }
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [testDriveOpen, testDriveProductCode, testDriveVariantCode]);

  // When picker product selection changes, update selectedProduct and reset variantCode
  useEffect(() => {
    if (!isPickerMode) return;
    const found = products.find((p) => p.productCode === formState.productCode) ?? null;
    setSelectedProduct(found);
    if (found?.variants?.length) {
      setFormState((prev) => ({ ...prev, variantCode: found.variants[0].variantCode }));
    } else {
      setFormState((prev) => ({ ...prev, variantCode: '' }));
    }
  }, [formState.productCode, isPickerMode, products]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: name === 'expectedDurationMinutes' ? parseInt(value, 10) || 30 : value,
    }));
  };

  const validate = (): boolean => {
    if (isPickerMode && !formState.productCode) {
      setSubmitError('Vui lòng chọn sản phẩm');
      return false;
    }
    if (!formState.scheduledDate) {
      setSubmitError('Vui lòng chọn ngày giờ lái thử');
      return false;
    }
    const selectedDate = new Date(formState.scheduledDate);
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
    if (selectedDate < oneHourLater) {
      setSubmitError('Ngày giờ lái thử phải cách hiện tại ít nhất 1 giờ');
      return false;
    }
    if (!formState.location) {
      setSubmitError('Vui lòng chọn địa điểm');
      return false;
    }
    if (formState.expectedDurationMinutes < 15 || formState.expectedDurationMinutes > 240) {
      setSubmitError('Thời lượng lái thử phải từ 15 đến 240 phút');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    try {
      setSubmitting(true);

      const request: TestDriveCreateRequest = {
        productCode: formState.productCode,
        variantCode: formState.variantCode || undefined,
        scheduledDate: new Date(formState.scheduledDate).toISOString(),
        location: formState.location,
        expectedDurationMinutes: formState.expectedDurationMinutes,
        note: formState.note || undefined,
      };

      const response = await testDriveService.bookTestDrive(request);

      if (response.code === 200 || response.code === 201) {
        setSuccessMessage('Đặt lái thử thành công! Đang chuyển hướng...');
        setTimeout(() => {
          closeTestDriveModal();
          navigate('/my-test-drives');
        }, 1800);
      } else {
        setSubmitError(response.message || 'Không thể đặt lái thử. Vui lòng thử lại.');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!testDriveOpen) return null;

  return (
    <div className="td-modal-overlay" onClick={closeTestDriveModal}>
      <div className="td-modal" onClick={(e) => e.stopPropagation()}>
        <div className="td-modal-header">
          <h2>Đăng ký lái thử</h2>
          <button className="td-modal-close" onClick={closeTestDriveModal} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <form className="td-modal-body" onSubmit={handleSubmit}>
          {/* Product picker (picker mode) */}
          {isPickerMode && (
            <div className="td-field">
              <label htmlFor="td-productCode">Sản phẩm <span style={{ color: '#cc0000' }}>*</span></label>
              {loadingProducts ? (
                <p className="td-field-hint">Đang tải danh sách xe...</p>
              ) : (
                <select
                  id="td-productCode"
                  name="productCode"
                  value={formState.productCode}
                  onChange={handleChange}
                  className="td-input"
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.productCode} value={p.productCode}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Product info (pre-selected mode) */}
          {!isPickerMode && selectedProduct && (
            <div className="td-field">
              <label>Sản phẩm</label>
              <div className="td-product-info">
                <div className="td-product-info-label">Xe đã chọn</div>
                <div className="td-product-info-name">{selectedProduct.name}</div>
              </div>
            </div>
          )}

          {/* Variant selector */}
          {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
            <div className="td-field">
              <label htmlFor="td-variantCode">Phiên bản</label>
              <select
                id="td-variantCode"
                name="variantCode"
                value={formState.variantCode}
                onChange={handleChange}
                className="td-input"
              >
                {selectedProduct.variants.map((v) => (
                  <option key={v.variantCode} value={v.variantCode}>
                    {v.variantName} — {v.price.toLocaleString('vi-VN')} VND
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date/time */}
          <div className="td-field">
            <label htmlFor="td-scheduledDate">
              Ngày giờ lái thử <span style={{ color: '#cc0000' }}>*</span>
            </label>
            <input
              type="datetime-local"
              id="td-scheduledDate"
              name="scheduledDate"
              value={formState.scheduledDate}
              onChange={handleChange}
              min={getMinDateTime()}
              className="td-input"
              required
            />
            <span className="td-field-hint">Tối thiểu 1 giờ kể từ bây giờ</span>
          </div>

          {/* Location */}
          <div className="td-field">
            <label htmlFor="td-location">
              Địa điểm <span style={{ color: '#cc0000' }}>*</span>
            </label>
            <select
              id="td-location"
              name="location"
              value={formState.location}
              onChange={handleChange}
              className="td-input"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="td-field">
            <label htmlFor="td-duration">
              Thời lượng dự kiến (phút) <span style={{ color: '#cc0000' }}>*</span>
            </label>
            <input
              type="number"
              id="td-duration"
              name="expectedDurationMinutes"
              value={formState.expectedDurationMinutes}
              onChange={handleChange}
              min="15"
              max="240"
              className="td-input"
              required
            />
            <span className="td-field-hint">Từ 15 đến 240 phút</span>
          </div>

          {/* Notes */}
          <div className="td-field">
            <label htmlFor="td-note">Ghi chú (tùy chọn)</label>
            <textarea
              id="td-note"
              name="note"
              value={formState.note}
              onChange={handleChange}
              placeholder="Ghi chú hoặc yêu cầu đặc biệt..."
              rows={3}
              className="td-input"
            />
          </div>

          {submitError && <p className="td-error">{submitError}</p>}
          {successMessage && <p className="td-success">{successMessage}</p>}

          <div className="td-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeTestDriveModal}>
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !!successMessage}
            >
              {submitting ? 'Đang xử lý...' : 'Đặt lái thử'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
