import {
  buildSpliceRequest,
  canSplice,
  chanIdToScid,
  hasSpliceFeature,
  isDecisiveUpdate,
  isNodeSpliceEnabled,
  mapSpliceChannel,
  mapSpliceEstimate,
  mapSpliceUpdate,
  parseChannelPoint,
} from './splice.helpers';

const TXID = '0ab444a7e53dafedc9970be718d83d1e2e66e2b220b7f9945383422676eef9e9';

describe('splice helpers', () => {
  describe('canSplice', () => {
    it('allows ok and peer_not_announcing only', () => {
      expect(canSplice('ok')).toBe(true);
      expect(canSplice('peer_not_announcing')).toBe(true);
      expect(canSplice('peer_unsupported')).toBe(false);
      expect(canSplice('peer_offline')).toBe(false);
      expect(canSplice('disabled')).toBe(false);
      expect(canSplice('something_new')).toBe(false);
      expect(canSplice('')).toBe(false);
      expect(canSplice(undefined)).toBe(false);
    });
  });

  describe('node status', () => {
    it('reads the splice feature bits', () => {
      expect(hasSpliceFeature([{ bit: 0 }, { bit: 63 }])).toBe(true);
      expect(hasSpliceFeature([{ bit: 62 }])).toBe(true);
      expect(hasSpliceFeature([{ bit: 0 }, { bit: 512 }])).toBe(false);
      expect(hasSpliceFeature(undefined)).toBe(false);
    });

    it('treats a disabled channel as splicing off', () => {
      expect(isNodeSpliceEnabled([{ bit: 63 }], ['ok', 'disabled'])).toBe(
        false
      );
      expect(isNodeSpliceEnabled([{ bit: 63 }], [])).toBe(true);
      expect(isNodeSpliceEnabled([{ bit: 0 }], ['ok'])).toBe(false);
    });

    it('falls back to the channels without features', () => {
      expect(isNodeSpliceEnabled(undefined, ['peer_unsupported'])).toBe(true);
      expect(isNodeSpliceEnabled(undefined, [])).toBe(false);
    });
  });

  describe('chanIdToScid', () => {
    it('converts the uint64 to block x tx x output', () => {
      expect(chanIdToScid('1072741818179256320')).toBe('975653x72x0');
    });

    it('returns empty for zero or junk', () => {
      expect(chanIdToScid('0')).toBe('');
      expect(chanIdToScid('')).toBe('');
      expect(chanIdToScid('abc')).toBe('');
    });
  });

  describe('mapSpliceChannel', () => {
    it('maps the splice fields', () => {
      const channel = mapSpliceChannel({
        active: true,
        remote_pubkey: '02abc',
        channel_point: `${TXID}:0`,
        chan_id: '1072741818179256320',
        capacity: '50000000',
        local_balance: '46695597',
        remote_balance: '3000000',
        private: false,
        close_address: '',
        peer_alias: 'Forever Money',
        unified_sigs: true,
        splice_status: 'ok',
        pending_splice: {
          initiator: 'INITIATOR_LOCAL',
          state: 'broadcast',
          local_delta_sat: '-10195',
          remote_delta_sat: '0',
          fee_sat: '195',
          our_fee_sat: '195',
          sat_per_vbyte: '1',
          txid: 'ff'.repeat(32),
          broadcast_height: 980000,
          confirmations: 2,
          lock_depth: 6,
          we_locked: false,
          peer_locked: false,
          dead: false,
          relay_status: 'in_mempool',
          relay_reason: '',
          new_channel_point: `${'ff'.repeat(32)}:0`,
          new_capacity_sat: '49989805',
        },
        last_splice: {
          initiator: 'INITIATOR_REMOTE',
          local_delta_sat: '0',
          remote_delta_sat: '25000000',
          txid: TXID,
          time: '1792197430',
          outcome: 'locked',
          reason: '',
          reason_from_peer: false,
        },
        original_channel_point: `${'ab'.repeat(32)}:0`,
        original_chan_id: '0',
      });

      expect(channel).toMatchObject({
        id: '975653x72x0',
        original_id: '975653x72x0',
        original_channel_point: `${'ab'.repeat(32)}:0`,
        peer_alias: 'Forever Money',
        capacity: 50000000,
        close_address: null,
        can_splice: true,
      });
      expect(channel.pending_splice).toMatchObject({
        initiator: 'local',
        state: 'broadcast',
        local_delta: -10195,
        confirmations: 2,
        lock_depth: 6,
        relay_reason: null,
        new_capacity: 49989805,
      });
      expect(channel.last_splice).toMatchObject({
        initiator: 'remote',
        remote_delta: 25000000,
        outcome: 'locked',
        reason: null,
        time: new Date(1792197430 * 1000).toISOString(),
      });
    });

    it('drops the alias lookup error and missing splices', () => {
      const channel = mapSpliceChannel({
        peer_alias: 'unable to lookup peer alias: alias for node not found',
        splice_status: 'peer_offline',
        pending_splice: null,
        last_splice: null,
      });
      expect(channel.peer_alias).toBeNull();
      expect(channel.can_splice).toBe(false);
      expect(channel.pending_splice).toBeNull();
      expect(channel.last_splice).toBeNull();
    });
  });

  describe('parseChannelPoint', () => {
    it('splits txid and index', () => {
      expect(parseChannelPoint(` ${TXID.toUpperCase()}:8 `)).toEqual({
        funding_txid_str: TXID,
        output_index: 8,
      });
    });

    it('rejects anything else', () => {
      expect(() => parseChannelPoint('975653x72x0')).toThrow();
      expect(() => parseChannelPoint(`${TXID}`)).toThrow();
      expect(() => parseChannelPoint(`${TXID}:99999999999`)).toThrow();
    });
  });

  describe('buildSpliceRequest', () => {
    it('builds a splice out to the node wallet', () => {
      expect(
        buildSpliceRequest({
          channel_point: `${TXID}:0`,
          direction: 'out',
          amount: 10000,
          sat_per_vbyte: 2,
        })
      ).toEqual({
        channel_point: { funding_txid_str: TXID, output_index: 0 },
        direction: 'SPLICE_OUT',
        amount_sat: '10000',
        use_max: false,
        sat_per_vbyte: '2',
        target_conf: 0,
        addr: '',
      });
    });

    it('ignores the address and amount for a max splice in', () => {
      const request = buildSpliceRequest(
        {
          channel_point: `${TXID}:1`,
          direction: 'in',
          amount: 5,
          use_max: true,
          target_conf: 3,
          address: 'bc1qsomewhere',
          force_low_fee: true,
        },
        true
      );
      expect(request).toMatchObject({
        direction: 'SPLICE_IN',
        amount_sat: '0',
        use_max: true,
        target_conf: 3,
        addr: '',
        force_low_fee: true,
      });
    });

    it('keeps force_low_fee out of the estimate', () => {
      const request = buildSpliceRequest({
        channel_point: `${TXID}:0`,
        direction: 'out',
        amount: 1000,
        address: ' bc1qdest ',
        force_low_fee: true,
      });
      expect(request.addr).toBe('bc1qdest');
      expect(request).not.toHaveProperty('force_low_fee');
    });

    it('rejects bad input', () => {
      const base = { channel_point: `${TXID}:0`, direction: 'in' };
      expect(() => buildSpliceRequest({ ...base })).toThrow();
      expect(() => buildSpliceRequest({ ...base, amount: 1.5 })).toThrow();
      expect(() => buildSpliceRequest({ ...base, amount: -1 })).toThrow();
      expect(() =>
        buildSpliceRequest({ ...base, amount: 1000, sat_per_vbyte: 1.5 })
      ).toThrow();
      expect(() =>
        buildSpliceRequest({ ...base, amount: 1000, target_conf: 5000 })
      ).toThrow();
      expect(() =>
        buildSpliceRequest({ ...base, direction: 'sideways', amount: 1 })
      ).toThrow();
    });
  });

  describe('mapSpliceEstimate', () => {
    it('maps a real estimate', () => {
      expect(
        mapSpliceEstimate({
          fee_sat: '195',
          vbytes: '194',
          sat_per_vbyte: '1',
          amount_sat: '10000',
          min_sat: '330',
          max_in_sat: '100527613',
          max_out_sat: '4948323',
          min_sat_per_vbyte: '1',
          fee_estimate_source: 'estimate',
          anchor_reserve_sat: '100000',
          new_capacity_sat: '4989805',
          new_local_sat: '4988831',
          lock_depth: 6,
          destination_is_ours: true,
          refusal_code: '',
        })
      ).toEqual({
        fee: 195,
        vbytes: 194,
        sat_per_vbyte: 1,
        amount: 10000,
        min: 330,
        max_in: 100527613,
        max_out: 4948323,
        min_sat_per_vbyte: 1,
        fee_estimate_source: 'estimate',
        anchor_reserve: 100000,
        new_capacity: 4989805,
        new_local: 4988831,
        lock_depth: 6,
        destination_is_ours: true,
        refusal_code: null,
      });
    });
  });

  describe('splice updates', () => {
    it('maps an update', () => {
      expect(
        mapSpliceUpdate({
          state: 'aborted',
          reason: 'not today',
          reason_from_peer: true,
        })
      ).toEqual({
        state: 'aborted',
        txid: null,
        new_channel_point: null,
        confirmations: 0,
        reason: 'not today',
        reason_from_peer: true,
        timed_out: false,
      });
    });

    it('knows which states settle the answer', () => {
      expect(isDecisiveUpdate('preparing')).toBe(false);
      expect(isDecisiveUpdate('negotiating')).toBe(false);
      expect(isDecisiveUpdate('signed')).toBe(true);
      expect(isDecisiveUpdate('broadcast')).toBe(true);
      expect(isDecisiveUpdate('locked')).toBe(true);
      expect(isDecisiveUpdate('aborted')).toBe(true);
      expect(isDecisiveUpdate(undefined)).toBe(false);
    });
  });
});
