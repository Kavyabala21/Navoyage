export const environment = {
  production: false,
  apiBaseUrl: (globalThis as any).NAVOYAGE_CONFIG?.apiBaseUrl ?? 'http://localhost:5000/api',
  backendBaseUrl: (globalThis as any).NAVOYAGE_CONFIG?.backendBaseUrl ?? 'http://localhost:5000',
  notificationHubUrl: (globalThis as any).NAVOYAGE_CONFIG?.notificationHubUrl ?? 'http://localhost:5105/hubs/notifications'
};
