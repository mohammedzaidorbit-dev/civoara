export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  incidentId?: string;
}

export async function sendNotification(payload: NotificationPayload): Promise<{ success: boolean; id: string }> {
  // Foundational notification dispatcher interface
  const notificationId = `notif_${Date.now()}`;
  if (process.env.NODE_ENV === 'development') {
    // Development mock dispatch
    void payload;
  }
  return {
    success: true,
    id: notificationId,
  };
}
