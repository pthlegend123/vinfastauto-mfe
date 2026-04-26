export type NotificationType = 'ORDER' | 'TEST_DRIVE' | 'MAINTENANCE';

export interface NotificationDto {
  id: number;
  notificationType: NotificationType;
  title: string;
  message: string;
  referenceCode: string;
  isReaded: boolean;
  createdAt: string;
  customerCode: string;
}
