import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle, Pencil, ShoppingBag, Bike } from 'lucide-react';
import { customerService } from '../services/customer.service';
import type { CustomerProfile, KycUploadRequest } from '../services/customer.service';
import { useAuth } from '../context/AuthContext';

const KYC_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  UNVERIFIED: { label: 'Chưa xác minh', color: '#6c757d', bg: '#f0f0f0', Icon: AlertCircle },
  PENDING: { label: 'Đang xét duyệt', color: '#856404', bg: '#fff3cd', Icon: Clock },
  VERIFIED: { label: 'Đã xác minh', color: '#0f5132', bg: '#d1e7dd', Icon: CheckCircle },
  REJECTED: { label: 'Bị từ chối', color: '#842029', bg: '#f8d7da', Icon: XCircle },
};

const EMPTY_KYC: KycUploadRequest = {
  idCardNumber: '',
  idCardFrontUrl: '',
  idCardBackUrl: '',
  drivingLicenseNumber: '',
  drivingLicenseImageUrl: '',
  licenseClass: '',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '14px',
  fontWeight: '500',
  color: '#555',
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: '16px',
};

export default function Profile() {
  const navigate = useNavigate();
  const { isLoggedIn, openLoginModal } = useAuth();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [kycForm, setKycForm] = useState<KycUploadRequest>(EMPTY_KYC);
  const [submitting, setSubmitting] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      openLoginModal(() => navigate('/profile'));
    }
  }, [isLoggedIn, openLoginModal, navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchProfile();
  }, [isLoggedIn]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerService.getProfile();
      if (response.code === 200 && response.data) {
        setProfile(response.data);
        if (response.data.idCardNumber) {
          setKycForm({
            idCardNumber: response.data.idCardNumber || '',
            idCardFrontUrl: response.data.idCardFrontUrl || '',
            idCardBackUrl: response.data.idCardBackUrl || '',
            drivingLicenseNumber: response.data.drivingLicenseNumber || '',
            drivingLicenseImageUrl: response.data.drivingLicenseImageUrl || '',
            licenseClass: response.data.licenseClass || '',
          });
        }
      } else {
        setError(response.message || 'Không thể tải thông tin hồ sơ');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = () => {
    if (!profile) return;
    setEditFullName(profile.fullName);
    setEditEmail(profile.email || '');
    setEditMode(true);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEditSaving(true);
      setError(null);
      const response = await customerService.updateProfile(editFullName, editEmail);
      if (response.code === 200 && response.data) {
        setProfile(response.data);
        setEditMode(false);
        setSuccessMsg('Cập nhật thông tin thành công!');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError(response.message || 'Không thể cập nhật thông tin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setEditSaving(false);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const response = await customerService.uploadKyc(kycForm);
      if (response.code === 200 && response.data) {
        setProfile(response.data);
        setSuccessMsg('Nộp hồ sơ KYC thành công! Chúng tôi sẽ xét duyệt trong vòng 1-2 ngày làm việc.');
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setError(response.message || 'Không thể nộp hồ sơ KYC');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Vui lòng đăng nhập để xem hồ sơ</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
        Đang tải hồ sơ...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#cc0000' }}>{error || 'Không tìm thấy hồ sơ'}</p>
      </div>
    );
  }

  const kycConfig = KYC_STATUS_CONFIG[profile.kycStatus] || KYC_STATUS_CONFIG['UNVERIFIED'];
  const KycIcon = kycConfig.Icon;
  const showForm = profile.kycStatus === 'UNVERIFIED' || profile.kycStatus === 'REJECTED';

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
      <button
        onClick={() => navigate(-1)}
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

      <h1 style={{ fontSize: '28px', marginBottom: '24px', color: '#333' }}>Hồ sơ của tôi</h1>

      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#d1e7dd', color: '#0f5132', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#ffe6e6', color: '#cc0000', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Personal Info */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>Thông tin cá nhân</h2>
          {!editMode && (
            <button
              onClick={handleEditOpen}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #0066cc', borderRadius: '8px', color: '#0066cc', cursor: 'pointer', fontSize: '13px', padding: '6px 12px' }}
            >
              <Pencil size={14} /> Chỉnh sửa
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleProfileSave}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Họ và tên *</label>
              <input
                type="text"
                required
                value={editFullName}
                onChange={e => setEditFullName(e.target.value)}
                style={inputStyle}
                placeholder="Nhập họ và tên"
              />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                style={inputStyle}
                placeholder="Nhập email"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5', fontSize: '14px', marginBottom: '16px' }}>
              <span style={{ color: '#666' }}>Số điện thoại</span>
              <span style={{ color: '#333', fontWeight: '500' }}>{profile.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5', fontSize: '14px', marginBottom: '16px' }}>
              <span style={{ color: '#666' }}>Mã khách hàng</span>
              <span style={{ color: '#333', fontWeight: '500' }}>{profile.customerCode}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={editSaving}
                style={{ padding: '10px 20px', backgroundColor: editSaving ? '#ccc' : '#0066cc', color: '#fff', border: 'none', borderRadius: '8px', cursor: editSaving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}
              >
                {editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                style={{ padding: '10px 20px', backgroundColor: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <>
            {[
              { label: 'Họ và tên', value: profile.fullName },
              { label: 'Số điện thoại', value: profile.phone },
              { label: 'Email', value: profile.email || '—' },
              { label: 'Mã khách hàng', value: profile.customerCode },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>{label}</span>
                <span style={{ color: '#333', fontWeight: '500' }}>{value}</span>
              </div>
            ))}
          </>
        )}

        {/* Quick navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
          <button
            onClick={() => navigate('/my-orders')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: '#f0f7ff', color: '#0066cc', border: '1px solid #cce0ff', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            <ShoppingBag size={16} /> Đơn hàng của tôi
          </button>
          <button
            onClick={() => navigate('/my-test-drives')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: '#f0fff4', color: '#0a9e50', border: '1px solid #b2f0cb', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            <Bike size={16} /> Lịch lái thử của tôi
          </button>
        </div>
      </div>

      {/* KYC Section */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>Xác minh danh tính (eKYC)</h2>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              backgroundColor: kycConfig.bg,
              color: kycConfig.color,
            }}
          >
            <KycIcon size={14} />
            {kycConfig.label}
          </span>
        </div>

        {profile.kycStatus === 'REJECTED' && profile.kycRejectionReason && (
          <div style={{ padding: '12px', backgroundColor: '#f8d7da', color: '#842029', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            <strong>Lý do từ chối:</strong> {profile.kycRejectionReason}
          </div>
        )}

        {profile.kycStatus === 'PENDING' && (
          <div style={{ padding: '16px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '8px', fontSize: '14px' }}>
            Hồ sơ của bạn đang được xét duyệt. Chúng tôi sẽ thông báo kết quả trong vòng 1–2 ngày làm việc.
          </div>
        )}

        {profile.kycStatus === 'VERIFIED' && (
          <div>
            <div style={{ padding: '12px', backgroundColor: '#d1e7dd', color: '#0f5132', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              Danh tính của bạn đã được xác minh thành công.
            </div>
            {[
              { label: 'Số CCCD/CMND', value: profile.idCardNumber },
              { label: 'Ảnh mặt trước CCCD', value: profile.idCardFrontUrl },
              { label: 'Ảnh mặt sau CCCD', value: profile.idCardBackUrl },
              { label: 'Số bằng lái xe', value: profile.drivingLicenseNumber },
              { label: 'Ảnh bằng lái xe', value: profile.drivingLicenseImageUrl },
              { label: 'Hạng bằng lái', value: profile.licenseClass },
            ].map(({ label, value }) => value && (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>{label}</span>
                <span style={{ color: '#333', maxWidth: '60%', wordBreak: 'break-all', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleKycSubmit}>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              Vui lòng cung cấp thông tin giấy tờ để hoàn tất xác minh danh tính.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Số CCCD/CMND *</label>
                <input
                  type="text"
                  required
                  value={kycForm.idCardNumber}
                  onChange={e => setKycForm({ ...kycForm, idCardNumber: e.target.value })}
                  style={inputStyle}
                  placeholder="Nhập số CCCD"
                />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Hạng bằng lái *</label>
                <input
                  type="text"
                  required
                  value={kycForm.licenseClass}
                  onChange={e => setKycForm({ ...kycForm, licenseClass: e.target.value })}
                  style={inputStyle}
                  placeholder="VD: B1, B2, C..."
                />
              </div>
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Link ảnh mặt trước CCCD *</label>
              <input
                type="text"
                required
                value={kycForm.idCardFrontUrl}
                onChange={e => setKycForm({ ...kycForm, idCardFrontUrl: e.target.value })}
                style={inputStyle}
                placeholder="https://..."
              />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Link ảnh mặt sau CCCD *</label>
              <input
                type="text"
                required
                value={kycForm.idCardBackUrl}
                onChange={e => setKycForm({ ...kycForm, idCardBackUrl: e.target.value })}
                style={inputStyle}
                placeholder="https://..."
              />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Số bằng lái xe *</label>
              <input
                type="text"
                required
                value={kycForm.drivingLicenseNumber}
                onChange={e => setKycForm({ ...kycForm, drivingLicenseNumber: e.target.value })}
                style={inputStyle}
                placeholder="Nhập số bằng lái"
              />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Link ảnh bằng lái xe *</label>
              <input
                type="text"
                required
                value={kycForm.drivingLicenseImageUrl}
                onChange={e => setKycForm({ ...kycForm, drivingLicenseImageUrl: e.target.value })}
                style={inputStyle}
                placeholder="https://..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: '8px',
                padding: '12px 24px',
                backgroundColor: submitting ? '#ccc' : '#0066cc',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '600',
              }}
            >
              {submitting ? 'Đang nộp...' : 'Nộp hồ sơ KYC'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
