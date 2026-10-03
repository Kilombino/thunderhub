import { translate } from './index';

describe('translate', () => {
  it('uses Spanish when available', () => {
    expect(translate('es', 'common.cancel')).toBe('Cancelar');
  });

  it('falls back to English, then to the key', () => {
    expect(translate('en', 'common.cancel')).toBe('Cancel');
    expect(translate('es', 'missing.key' as any)).toBe('missing.key');
  });

  it('interpolates variables', () => {
    expect(translate('en', 'common.minutesLeft', { minutes: 5 })).toBe(
      '5 min left'
    );
  });
});
