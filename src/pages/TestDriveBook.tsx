import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { productService } from '../services/product.service';
import { testDriveService } from '../services/testDrive.service';
import { customerService } from '../services/customer.service';
import { useAuth } from '../context/AuthContext';
import { sharedDataService } from '../services/shared-data.service';
import type { Product } from '../types/product.types';
import type { TestDriveCreateRequest } from '../types/testDrive.types';
import { getTestDriveKycGateCopy, isKycVerified, shouldShowKycAction } from '../utils/kyc';

interface FormState {
  variantCode: string;
  scheduledDate: string;
  location: string;
  expectedDurationMinutes: number;
  note: string;
}

export default function TestDriveBook() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, openLoginModal } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  const kycGateCopy = getTestDriveKycGateCopy(kycStatus);
  const kycReady = isKycVerified(kycStatus);

  const loadKycStatus = useCallback(async () => {
    setLoadingKyc(true);
    setKycError(null);
    try {
      const response = await customerService.getProfile();
      if (response.code === 200 && response.data) {
        setKycStatus(response.data.kycStatus);
      } else {
        throw new Error(response.message || 'Không thể kiểm tra trạng thái KYC');
      }
    } catch (err) {
      setKycStatus(null);
      setKycError(err instanceof Error ? err.message : 'Không thể kiểm tra trạng thái KYC');
    } finally {
      setLoadingKyc(false);
    }
  }, []);

  const [formState, setFormState] = useState<FormState>({
    variantCode: '',
    scheduledDate: '',
    location: 'Hà Nội Showroom',
    expectedDurationMinutes: 30,
    note: '',
  });

  const locations = [
    'Hà Nội Showroom',
    'TP.HCM Showroom',
    'Đà Nẵng Showroom',
    'Cần Thơ Showroom',
  ];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      openLoginModal(() => navigate(`/test-drive-book/${productId}`));
    }
  }, [isLoggedIn, openLoginModal, navigate, productId]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setKycStatus(null);
    setKycError(null);
    void loadKycStatus();
  }, [isLoggedIn, loadKycStatus]);

  // Fetch product data
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try shared data service first
        if (sharedDataService.hasFetchedProducts) {
          const foundProduct = sharedDataService.getProductByCode(productId);
          if (foundProduct) {
            setProduct(foundProduct);
            if (foundProduct.variants && foundProduct.variants.length > 0) {
              setFormState((prev) => ({
                ...prev,
                variantCode: foundProduct.variants[0].variantCode,
              }));
            }
            setLoading(false);
            return;
          }
        }

        // Fallback: fetch all products
        const responseData = await productService.getAllProducts();
        if (responseData.code === 200 && responseData.data?.content) {
          sharedDataService.setProducts(responseData.data.content);
          const foundProduct = sharedDataService.getProductByCode(productId);
          if (foundProduct) {
            setProduct(foundProduct);
            if (foundProduct.variants && foundProduct.variants.length > 0) {
              setFormState((prev) => ({
                ...prev,
                variantCode: foundProduct.variants[0].variantCode,
              }));
            }
          } else {
            setError('Không tìm thấy sản phẩm');
          }
        } else {
          setError(responseData.message || 'Không tìm thấy sản phẩm');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const getMinDateTime = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'expectedDurationMinutes') {
      setFormState((prev) => ({
        ...prev,
        [name]: parseInt(value, 10) || 30,
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    if (loadingKyc) {
      setSubmitError('Đang kiểm tra trạng thái KYC, vui lòng thử lại sau vài giây.');
      return false;
    }

    if (kycError) {
      setSubmitError(kycError);
      return false;
    }

    if (!kycReady) {
      setSubmitError(kycGateCopy.message);
      return false;
    }

    if (!formState.scheduledDate) {
      setSubmitError('Vui lòng chọn ngày giờ lái thử');
      return false;
    }

    const selectedDate = new Date(formState.scheduledDate);
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

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

    if (!validateForm() || !productId) {
      return;
    }

    try {
      setSubmitting(true);

      const request: TestDriveCreateRequest = {
        productCode: productId,
        variantCode: formState.variantCode || undefined,
        scheduledDate: new Date(formState.scheduledDate).toISOString(),
        location: formState.location,
        expectedDurationMinutes: formState.expectedDurationMinutes,
        note: formState.note || undefined,
      };

      const response = await testDriveService.bookTestDrive(request);

      if (response.code === 200 || response.code === 201) {
        setSuccessMessage('Đặt lái thử thành công! Chuyển hướng...');
        setTimeout(() => {
          navigate('/my-test-drives');
        }, 2000);
      } else {
        setSubmitError(response.message || 'Không thể đặt lái thử. Vui lòng thử lại');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToKyc = () => {
    navigate('/profile');
  };

  const submitDisabled = submitting || loadingKyc || !!kycError || !kycReady;

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Đang tải thông tin xe...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '20px' }}>{error || 'Không tìm thấy xe'}</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/')}
          style={{ padding: '10px 20px' }}
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <button
        onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#0066cc',
          cursor: 'pointer',
          fontSize: '16px',
          marginBottom: '30px',
        }}
      >
        <ArrowLeft size={20} /> Quay lại
      </button>

      <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#333' }}>Đặt lái thử</h1>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>{product.name}</p>

      {(loadingKyc || kycError || !kycReady) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '14px',
            padding: '14px 16px',
            marginBottom: '20px',
            border: '1px solid #f0c36d',
            borderLeft: '4px solid #d97706',
            borderRadius: '8px',
            backgroundColor: '#fffbeb',
          }}
        >
          <div>
            <strong style={{ display: 'block', color: '#92400e', fontSize: '15px', marginBottom: '4px' }}>
              {loadingKyc
                ? 'Đang kiểm tra định danh KYC...'
                : kycError
                  ? 'Không kiểm tra được KYC'
                  : kycGateCopy.title}
            </strong>
            <p style={{ color: '#6b4e16', fontSize: '14px', lineHeight: 1.45, margin: 0 }}>
              {loadingKyc
                ? 'Vui lòng chờ trong giây lát.'
                : kycError ?? kycGateCopy.message}
            </p>
          </div>
          {!loadingKyc && !kycError && shouldShowKycAction(kycStatus) && kycGateCopy.actionLabel && (
            <button type="button" className="btn btn-primary" onClick={handleGoToKyc} style={{ whiteSpace: 'nowrap' }}>
              {kycGateCopy.actionLabel}
            </button>
          )}
          {kycError && (
            <button type="button" className="btn btn-secondary" onClick={() => void loadKycStatus()} style={{ whiteSpace: 'nowrap' }}>
              Thử lại
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Product info (read-only) */}
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            borderLeft: '4px solid #0066cc',
          }}
        >
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Sản phẩm</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>{product.name}</div>
        </div>

        {/* Variant selector */}
        {product.variants && product.variants.length > 0 && (
          <div>
            <label htmlFor="variantCode" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Phiên bản <span style={{ color: '#cc0000' }}>*</span>
            </label>
            <select
              id="variantCode"
              name="variantCode"
              value={formState.variantCode}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            >
              {product.variants.map((variant) => (
                <option key={variant.variantCode} value={variant.variantCode}>
                  {variant.variantName} - {variant.price.toLocaleString('vi-VN')} VND
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date time picker */}
        <div>
          <label htmlFor="scheduledDate" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Ngày giờ lái thử <span style={{ color: '#cc0000' }}>*</span>
          </label>
          <input
            type="datetime-local"
            id="scheduledDate"
            name="scheduledDate"
            value={formState.scheduledDate}
            onChange={handleInputChange}
            min={getMinDateTime()}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>Tối thiểu 1 giờ kể từ bây giờ</div>
        </div>

        {/* Location selector */}
        <div>
          <label htmlFor="location" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Địa điểm lái thử <span style={{ color: '#cc0000' }}>*</span>
          </label>
          <select
            id="location"
            name="location"
            value={formState.location}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="expectedDurationMinutes" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Thời lượng dự kiến (phút) <span style={{ color: '#cc0000' }}>*</span>
          </label>
          <input
            type="number"
            id="expectedDurationMinutes"
            name="expectedDurationMinutes"
            value={formState.expectedDurationMinutes}
            onChange={handleInputChange}
            min="15"
            max="240"
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>Từ 15 đến 240 phút</div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="note" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Ghi chú (tùy chọn)
          </label>
          <textarea
            id="note"
            name="note"
            value={formState.note}
            onChange={handleInputChange}
            placeholder="Ghi chú hoặc yêu cầu đặc biệt..."
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
            }}
          />
        </div>

        {/* Error message */}
        {submitError && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#ffe6e6',
              color: '#cc0000',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            {submitError}
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#e6ffe6',
              color: '#006600',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitDisabled}
          className="btn btn-primary"
          style={{
            padding: '12px 20px',
            fontSize: '16px',
            opacity: submitDisabled ? 0.7 : 1,
            cursor: submitDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Đang xử lý...' : kycReady ? 'Đặt lái thử' : 'Cần KYC để đặt lái thử'}
        </button>
      </form>
    </div>
  );
}
