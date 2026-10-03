import type { PartialMessages } from '../../index';

export const login: PartialMessages['login'] = {
  tagline: 'Supervisa y gestiona tu nodo Lightning desde cualquier lugar.',
  oldLnd:
    'ThunderHub es compatible con LND 0.11.0 o superior. Actualiza tu nodo: corres el riesgo de perder fondos.',
  accountLogin: 'Iniciar sesión con cuenta',
  ssoAccount: 'Cuenta SSO',
  enterCredentials: 'Introduce tus credenciales para conectarte',
  password: 'Contraseña',
  passwordPlaceholder: 'Introduce la contraseña',
  twofaCode: 'Código 2FA',
  ifEnabled: '(si está activado)',
  twofaPlaceholder: 'Código de 6 dígitos',
  connect: 'Conectar',
  login: 'Entrar',
  accounts: 'Cuentas',
  serverAccounts: 'Cuentas del servidor',
  otherAccounts: 'Otras cuentas',
  unableToConnect: 'No se puede conectar con este nodo',
  dbLogin: {
    subtitle: 'Inicia sesión con las credenciales de tu cuenta',
    email: 'Correo electrónico',
    emailPlaceholder: 'Introduce tu correo',
    signIn: 'Iniciar sesión',
  },
  intro: {
    welcome: 'Te damos la bienvenida a ThunderHub',
    getStarted: 'Para empezar, crea una cuenta en tu servidor.',
    viewInstructions: 'Ver instrucciones de instalación',
    alreadyCreated: '¿Ya has creado cuentas?',
    missingInfo:
      'Puede que a tus cuentas les falte información obligatoria. Revisa los registros del servidor para más detalles.',
    serverLogs:
      'Al arrancar, el servidor indica en sus registros qué cuentas están disponibles.',
  },
  continue: {
    yourAccount: 'tu cuenta',
    alreadySignedIn: 'Ya has iniciado sesión',
    continueAs: 'Continuar como',
    continue: 'Continuar',
    switchAccount: 'Entrar con otra cuenta',
  },
};
