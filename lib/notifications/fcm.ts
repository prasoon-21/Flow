export async function requestFcmToken(): Promise<{
  permission: NotificationPermission | 'unsupported';
  token: string | null;
  error?: string;
}> {
  return { permission: 'denied', token: null, error: 'FCM disabled in Flow MVP' };
}
