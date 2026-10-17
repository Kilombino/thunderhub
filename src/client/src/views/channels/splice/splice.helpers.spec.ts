import { translate } from '../../../i18n';
import {
  canProceed,
  countStatuses,
  isKnownRefusal,
  parseSats,
  parseWholeRate,
  reasonCode,
  refusalText,
  spliceStateKey,
  spliceStatusText,
} from './splice.helpers';

describe('client splice helpers', () => {
  it('reads the code at the start of a reason', () => {
    expect(reasonCode('above_max_out: 5000 out, 4000 available')).toBe(
      'above_max_out'
    );
    expect(reasonCode('peer_offline')).toBe('peer_offline');
    expect(reasonCode('The peer said no')).toBe('');
    expect(reasonCode(null)).toBe('');
  });

  it('explains the splice status, unknown ones as not now', () => {
    expect(spliceStatusText('peer_unsupported')).toEqual({
      key: 'splice.status.peer_unsupported',
    });
    expect(spliceStatusText('brand_new')).toEqual({
      key: 'splice.status.unknown',
      vars: { code: 'brand_new' },
    });
    const { key, vars } = spliceStatusText('peer_offline');
    expect(translate('es', key, vars)).toBe('El peer está desconectado');
    expect(translate('en', key, vars)).toBe('The peer is offline');
  });

  it('explains refusal codes, splice statuses among them', () => {
    expect(refusalText('fee_below_floor').key).toBe(
      'splice.reasons.fee_below_floor'
    );
    expect(refusalText('above_max_out: 5000 out').key).toBe(
      'splice.reasons.above_max_out'
    );
    expect(refusalText('peer_unsupported').key).toBe(
      'splice.status.peer_unsupported'
    );
    expect(refusalText('weird thing')).toEqual({
      key: 'splice.reasons.unknown',
      vars: { code: 'weird thing' },
    });
    expect(refusalText('ok').key).toBe('splice.reasons.unknown');
    expect(isKnownRefusal('insufficient_funds')).toBe(true);
    expect(isKnownRefusal('channel x: channel not found')).toBe(false);
  });

  it('has a Spanish text for every refusal it knows', () => {
    for (const code of ['node_cap', 'immature_inputs', 'peer_disconnected']) {
      const { key } = refusalText(code);
      expect(translate('es', key)).not.toBe(key);
    }
  });

  it('maps states to keys', () => {
    expect(spliceStateKey('broadcast')).toBe('splice.states.broadcast');
    expect(spliceStateKey('nope')).toBeNull();
  });

  it('counts channels by status', () => {
    expect(
      countStatuses([
        { splice_status: 'ok', can_splice: true },
        { splice_status: 'peer_not_announcing', can_splice: true },
        { splice_status: 'peer_unsupported', can_splice: false },
        { splice_status: 'peer_offline', can_splice: false },
        { splice_status: 'pending', can_splice: false },
      ])
    ).toEqual({ ready: 2, unsupported: 1, offline: 1, other: 1 });
  });

  it('parses whole sats with thousands separators', () => {
    expect(parseSats('10000')).toBe(10000);
    expect(parseSats(' 1.000.000 ')).toBe(1000000);
    expect(parseSats('1,000')).toBe(1000);
    expect(parseSats('1 000')).toBe(1000);
    expect(parseSats('1.5')).toBeNull();
    expect(parseSats('0')).toBeNull();
    expect(parseSats('')).toBeNull();
    expect(parseSats('abc')).toBeNull();
  });

  it('parses whole fee rates', () => {
    expect(parseWholeRate('')).toBeNull();
    expect(parseWholeRate('3')).toBe(3);
    expect(parseWholeRate('1.5')).toBeNaN();
  });

  it('only lets a forced low fee through', () => {
    expect(canProceed(null, false)).toBe(true);
    expect(canProceed('fee_below_floor', false)).toBe(false);
    expect(canProceed('fee_below_floor', true)).toBe(true);
    expect(canProceed('peer_offline', true)).toBe(false);
  });
});
