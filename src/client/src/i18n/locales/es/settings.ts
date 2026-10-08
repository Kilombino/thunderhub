import type { PartialMessages } from '../../index';

export const settings: PartialMessages['settings'] = {
  title: 'Ajustes',
  language: {
    title: 'Idioma',
    description: 'Idioma de la interfaz. La página se recarga para aplicarlo.',
  },
  interface: {
    title: 'Interfaz',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    currency: 'Moneda',
    fiatCurrency: 'Moneda fiat',
  },
  notifications: {
    title: 'Notificaciones',
    invoices: 'Facturas',
    payments: 'Pagos',
    channels: 'Canales',
    forwards: 'Reenvíos',
    forwardAttempts: 'Intentos de reenvío',
    autoClose: 'Cierre automático',
  },
  security: {
    title: 'Seguridad',
    enable2fa: 'Activar 2FA',
    disable2fa: 'Desactivar 2FA',
    enable: 'Activar',
    disable: 'Desactivar',
    tokenPlaceholder: 'Introduce el código 2FA',
    secretError: 'No se ha podido obtener el secreto para activar el 2FA.',
    enabledToast: '2FA activado para la cuenta',
    disabledToast: '2FA desactivado para la cuenta',
  },
  dashboard: {
    title: 'Panel',
    widgets: 'Widgets',
    customize: 'Personalizar',
    reset: 'Restablecer',
    widgetsTitle: 'Widgets del panel',
    widgetsDescription: 'Activa o desactiva widgets para personalizar tu panel',
  },
  privacy: {
    title: 'Privacidad',
    fetchFees: 'Consultar comisiones de Bitcoin',
    fetchPrices: 'Consultar precios fiat',
    displayValues: 'Mostrar importes',
  },
};
