import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { testDriveService } from '../services/testDrive.service';
import { useAuth } from '../context/AuthContext';
import type { TestDriveDto } from '../types/testDrive.types';

interface RescheduleFormState {
  newScheduledDate: string;
  note: string;
}

interface CancelFormState {
  cancellationReason: string;
}

export default function TestDriveDetail() {
  const { testDriveCode } = useParams<{ testDriveCode: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, openLoginModal } = useAuth();

  const [testDrive, setTestDrive] = useState<TestDriveDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [rescheduleForm, setRescheduleForm] = useState<RescheduleFormState>({
    newScheduledDate: '',
    note: '',
  });

  const [cancelForm, setCancelForm] = useState<CancelFormState>({
    cancellationReason: '',
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      openLoginModal(() => navigate(`/my-test-drives/${testDriveCode}`));
    }
  }, [isLoggedIn, openLoginModal, navigate, testDriveCode]);

  // Fetch test drive details
  useEffect(() => {
    if (!isLoggedIn || !testDriveCode) return;

    const fetchTestDrive = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await testDriveService.getTestDriveById(testDriveCode);

        if (response.code === 200 && response.data) {
          setTestDrive(response.data);
          setRescheduleForm({
            newScheduledDate: response.data.scheduledDate,
            note: response.data.note || '',
          });
        } else {
          setError(response.message || 'Không tìm thấy thông tin lái thử');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
      } finally {
        setLoading(false);
      }
    };

    fetchTestDrive();
  }, [isLoggedIn, testDriveCode]);

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadgeStyle = (status: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      display: 'inline-block',
    };

    switch (status) {
      case 'PENDING':
        return {
          ...baseStyle,
          backgroundColor: '#fff3cd',
          color: '#856404',
        };
      case 'CONFIRMED':
        return {
          ...baseStyle,
          backgroundColor: '#cfe2ff',
          color: '#084298',
        };
      case 'COMPLETED':
        return {
          ...baseStyle,
          backgroundColor: '#d1e7dd',
          color: '#0f5132',
        };
      case 'CANCELLED':
        return {
          ...baseStyle,
          backgroundColor: '#f8d7da',
          color: '#842029',
        };
      default:
        return baseStyle;
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    return labels[status] || status;
  };

  const getMinDateTime = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  const handleRescheduleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRescheduleForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancelChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setCancelForm({
      cancellationReason: value,
    });
  };

  const handleReschedule = async () => {
    setSubmitError(null);
    setSuccessMessage(null);

    if (!rescheduleForm.newScheduledDate) {
      setSubmitError('Vui lòng chọn ngày giờ mới');
      return;
    }

    const selectedDate = new Date(rescheduleForm.newScheduledDate);
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    if (selectedDate < oneHourLater) {
      setSubmitError('Ngày giờ mới phải cách hiện tại ít nhất 1 giờ');
      return;
    }

    try {
      setSubmitting(true);

      const response = await testDriveService.rescheduleTestDrive(testDriveCode!, {
        newScheduledDate: new Date(rescheduleForm.newScheduledDate).toISOString(),
        note: rescheduleForm.note || undefined,
      });

      if (response.code === 200 && response.data) {
        setTestDrive(response.data);
        setSuccessMessage('Dời lịch lái thử thành công');
        setShowRescheduleForm(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setSubmitError(response.message || 'Không thể dời lịch lái thử');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setSubmitError(null);
    setSuccessMessage(null);

    if (!cancelForm.cancellationReason.trim()) {
      setSubmitError('Vui lòng nhập lý do hủy');
      return;
    }

    try {
      setSubmitting(true);

      const response = await testDriveService.cancelTestDrive(testDriveCode!, {
        cancellationReason: cancelForm.cancellationReason,
      });

      if (response.code === 200 && response.data) {
        setTestDrive(response.data);
        setSuccessMessage('Hủy lái thử thành công');
        setShowCancelForm(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setSubmitError(response.message || 'Không thể hủy lái thử');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '120px 20px 40px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Vui lòng đăng nhập để xem chi tiết lái thử</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '120px 20px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Đang tải thông tin...</div>
      </div>
    );
  }

  if (error || !testDrive) {
    return (
      <div style={{ padding: '120px 20px 40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '20px' }}>{error || 'Không tìm thấy thông tin lái thử'}</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/my-test-drives')}
          style={{ padding: '10px 20px' }}
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '100px 20px 40px' }}>
      <button
        onClick={() => navigate('/my-test-drives')}
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
        <ArrowLeft size={20} /> Quay lại danh sách
      </button>

      <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#333' }}>Chi tiết lái thử</h1>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
        Mã lái thử: {testDrive.testDriveCode}
      </p>

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#ffe6e6',
            color: '#cc0000',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#e6ffe6',
            color: '#006600',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '20px',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Sản phẩm</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
            {testDrive.productCode}
          </div>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Phiên bản</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
            {testDrive.variantCode || 'N/A'}
          </div>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Ngày giờ</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
            {formatDateTime(testDrive.scheduledDate)}
          </div>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Địa điểm</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>{testDrive.location}</div>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Thời lượng dự kiến</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
            {testDrive.expectedDurationMinutes} phút
          </div>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Trạng thái</div>
          <span style={getStatusBadgeStyle(testDrive.status)}>
            {getStatusLabel(testDrive.status)}
          </span>
        </div>
      </div>

      {testDrive.note && (
        <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginBottom: '30px' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px', fontWeight: '600' }}>
            Ghi chú
          </div>
          <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>{testDrive.note}</div>
        </div>
      )}

      {testDrive.cancelReason && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f8d7da',
            borderRadius: '8px',
            marginBottom: '30px',
            borderLeft: '4px solid #842029',
          }}
        >
          <div style={{ fontSize: '12px', color: '#842029', marginBottom: '8px', fontWeight: '600' }}>
            Lý do hủy
          </div>
          <div style={{ fontSize: '14px', color: '#842029', lineHeight: '1.6' }}>
            {testDrive.cancelReason}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {(testDrive.status === 'PENDING' || testDrive.status === 'CONFIRMED') && (
          <>
            <button
              onClick={() => setShowRescheduleForm(!showRescheduleForm)}
              className="btn btn-outline"
              style={{ padding: '12px 20px' }}
            >
              {showRescheduleForm ? 'Hủy' : 'Dời lịch lái thử'}
            </button>

            {showRescheduleForm && (
              <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label
                    htmlFor="newScheduledDate"
                    style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}
                  >
                    Ngày giờ mới <span style={{ color: '#cc0000' }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="newScheduledDate"
                    name="newScheduledDate"
                    value={rescheduleForm.newScheduledDate}
                    onChange={handleRescheduleChange}
                    min={getMinDateTime()}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label
                    htmlFor="rescheduleNote"
                    style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}
                  >
                    Ghi chú thêm
                  </label>
                  <textarea
                    id="rescheduleNote"
                    name="note"
                    value={rescheduleForm.note}
                    onChange={handleRescheduleChange}
                    rows={3}
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

                {submitError && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#ffe6e6',
                      color: '#cc0000',
                      borderRadius: '6px',
                      fontSize: '13px',
                      marginBottom: '15px',
                    }}
                  >
                    {submitError}
                  </div>
                )}

                <button
                  onClick={handleReschedule}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Đang xử lý...' : 'Xác nhận dời lịch'}
                </button>
              </div>
            )}
          </>
        )}

        {(testDrive.status === 'PENDING' || testDrive.status === 'CONFIRMED') && (
          <>
            <button
              onClick={() => setShowCancelForm(!showCancelForm)}
              style={{
                padding: '12px 20px',
                backgroundColor: '#f8d7da',
                color: '#842029',
                border: '1px solid #f5c6cb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '16px',
              }}
            >
              {showCancelForm ? 'Hủy' : 'Hủy lái thử'}
            </button>

            {showCancelForm && (
              <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label
                    htmlFor="cancellationReason"
                    style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}
                  >
                    Lý do hủy <span style={{ color: '#cc0000' }}>*</span>
                  </label>
                  <textarea
                    id="cancellationReason"
                    name="cancellationReason"
                    value={cancelForm.cancellationReason}
                    onChange={handleCancelChange}
                    placeholder="Vui lòng cho chúng tôi biết lý do hủy..."
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

                {submitError && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#ffe6e6',
                      color: '#cc0000',
                      borderRadius: '6px',
                      fontSize: '13px',
                      marginBottom: '15px',
                    }}
                  >
                    {submitError}
                  </div>
                )}

                <button
                  onClick={handleCancel}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: '#842029',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: '16px',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Đang xử lý...' : 'Xác nhận hủy'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
