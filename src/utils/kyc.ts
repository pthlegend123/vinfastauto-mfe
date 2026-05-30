export const isKycVerified = (status?: string | null): boolean => status === 'VERIFIED';

export const shouldShowKycAction = (status?: string | null): boolean =>
  status !== 'VERIFIED' && status !== 'PENDING';

export const getTestDriveKycGateCopy = (
  status?: string | null
): { title: string; message: string; actionLabel?: string } => {
  if (status === 'PENDING') {
    return {
      title: 'Hồ sơ KYC đang chờ duyệt',
      message: 'Bạn đã gửi hồ sơ định danh. Vui lòng chờ nhân viên duyệt trước khi đăng ký lái thử.',
    };
  }

  if (status === 'REJECTED') {
    return {
      title: 'Cần gửi lại định danh KYC',
      message: 'Hồ sơ KYC trước đó chưa được duyệt. Vui lòng cập nhật lại CCCD và bằng lái xe trong hồ sơ.',
      actionLabel: 'Cập nhật KYC',
    };
  }

  return {
    title: 'Cần định danh KYC',
    message: 'Bạn cần gửi CCCD và bằng lái xe để nhân viên xác minh trước khi đăng ký lái thử.',
    actionLabel: 'Gửi định danh KYC',
  };
};
