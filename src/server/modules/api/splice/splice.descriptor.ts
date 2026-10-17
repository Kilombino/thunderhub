/**
 * protobufjs JSON descriptor of the part of lnrpc/lightning.proto that
 * splicing needs, from the XBT LND fork (tag v0.21.4-beta-blake2b.19).
 * The lightning package bundles LND's upstream proto, which has neither the
 * splice RPCs nor the splice fields (1001-1006) of Channel, so ThunderHub
 * loads this one itself. Channel only lists the fields read here: protobuf
 * skips the others when decoding.
 *
 * Field names are snake_case (keepCase), as the lightning package uses.
 */
export const spliceDescriptor = {
  nested: {
    lnrpc: {
      options: {
        go_package: 'github.com/lightningnetwork/lnd/lnrpc',
      },
      nested: {
        Lightning: {
          methods: {
            ListChannels: {
              requestType: 'ListChannelsRequest',
              responseType: 'ListChannelsResponse',
            },
            EstimateSplice: {
              requestType: 'EstimateSpliceRequest',
              responseType: 'EstimateSpliceResponse',
            },
            SpliceChannel: {
              requestType: 'SpliceChannelRequest',
              responseType: 'SpliceUpdate',
              responseStream: true,
            },
          },
        },
        Initiator: {
          values: {
            INITIATOR_UNKNOWN: 0,
            INITIATOR_LOCAL: 1,
            INITIATOR_REMOTE: 2,
            INITIATOR_BOTH: 3,
          },
        },
        SpliceDirection: {
          values: { SPLICE_IN: 0, SPLICE_OUT: 1 },
        },
        ChannelPoint: {
          oneofs: {
            funding_txid: {
              oneof: ['funding_txid_bytes', 'funding_txid_str'],
            },
          },
          fields: {
            funding_txid_bytes: { type: 'bytes', id: 1 },
            funding_txid_str: { type: 'string', id: 2 },
            output_index: { type: 'uint32', id: 3 },
          },
        },
        ListChannelsRequest: {
          fields: {
            active_only: { type: 'bool', id: 1 },
            inactive_only: { type: 'bool', id: 2 },
            public_only: { type: 'bool', id: 3 },
            private_only: { type: 'bool', id: 4 },
            peer: { type: 'bytes', id: 5 },
            peer_alias_lookup: { type: 'bool', id: 6 },
          },
        },
        ListChannelsResponse: {
          fields: {
            channels: { rule: 'repeated', type: 'Channel', id: 11 },
          },
        },
        Channel: {
          fields: {
            active: { type: 'bool', id: 1 },
            remote_pubkey: { type: 'string', id: 2 },
            channel_point: { type: 'string', id: 3 },
            chan_id: { type: 'uint64', id: 4 },
            capacity: { type: 'int64', id: 5 },
            local_balance: { type: 'int64', id: 6 },
            remote_balance: { type: 'int64', id: 7 },
            private: { type: 'bool', id: 17 },
            initiator: { type: 'bool', id: 18 },
            close_address: { type: 'string', id: 25 },
            zero_conf: { type: 'bool', id: 32 },
            peer_alias: { type: 'string', id: 34 },
            unified_sigs: { type: 'bool', id: 1001 },
            splice_status: { type: 'string', id: 1002 },
            pending_splice: { type: 'PendingSplice', id: 1003 },
            last_splice: { type: 'LastSplice', id: 1004 },
            original_channel_point: { type: 'string', id: 1005 },
            original_chan_id: { type: 'uint64', id: 1006 },
          },
        },
        PendingSplice: {
          fields: {
            initiator: { type: 'Initiator', id: 1 },
            state: { type: 'string', id: 2 },
            local_delta_sat: { type: 'int64', id: 3 },
            remote_delta_sat: { type: 'int64', id: 4 },
            fee_sat: { type: 'int64', id: 5 },
            our_fee_sat: { type: 'int64', id: 6 },
            sat_per_vbyte: { type: 'uint64', id: 7 },
            txid: { type: 'string', id: 8 },
            broadcast_height: { type: 'uint32', id: 9 },
            confirmations: { type: 'uint32', id: 10 },
            lock_depth: { type: 'uint32', id: 11 },
            we_locked: { type: 'bool', id: 12 },
            peer_locked: { type: 'bool', id: 13 },
            dead: { type: 'bool', id: 14 },
            relay_status: { type: 'string', id: 15 },
            relay_reason: { type: 'string', id: 16 },
            new_channel_point: { type: 'string', id: 17 },
            new_capacity_sat: { type: 'int64', id: 18 },
          },
        },
        LastSplice: {
          fields: {
            initiator: { type: 'Initiator', id: 1 },
            local_delta_sat: { type: 'int64', id: 2 },
            remote_delta_sat: { type: 'int64', id: 3 },
            txid: { type: 'string', id: 4 },
            time: { type: 'int64', id: 5 },
            outcome: { type: 'string', id: 6 },
            reason: { type: 'string', id: 7 },
            reason_from_peer: { type: 'bool', id: 8 },
          },
        },
        EstimateSpliceRequest: {
          fields: {
            channel_point: { type: 'ChannelPoint', id: 1 },
            direction: { type: 'SpliceDirection', id: 2 },
            amount_sat: { type: 'int64', id: 3 },
            use_max: { type: 'bool', id: 4 },
            sat_per_vbyte: { type: 'uint64', id: 5 },
            target_conf: { type: 'int32', id: 6 },
            addr: { type: 'string', id: 7 },
          },
        },
        EstimateSpliceResponse: {
          fields: {
            fee_sat: { type: 'int64', id: 1 },
            vbytes: { type: 'int64', id: 2 },
            sat_per_vbyte: { type: 'uint64', id: 3 },
            amount_sat: { type: 'int64', id: 4 },
            min_sat: { type: 'int64', id: 5 },
            max_in_sat: { type: 'int64', id: 6 },
            max_out_sat: { type: 'int64', id: 7 },
            min_sat_per_vbyte: { type: 'uint64', id: 8 },
            fee_estimate_source: { type: 'string', id: 9 },
            anchor_reserve_sat: { type: 'int64', id: 10 },
            new_capacity_sat: { type: 'int64', id: 11 },
            new_local_sat: { type: 'int64', id: 12 },
            lock_depth: { type: 'uint32', id: 13 },
            destination_is_ours: { type: 'bool', id: 14 },
            refusal_code: { type: 'string', id: 15 },
          },
        },
        SpliceChannelRequest: {
          fields: {
            channel_point: { type: 'ChannelPoint', id: 1 },
            direction: { type: 'SpliceDirection', id: 2 },
            amount_sat: { type: 'int64', id: 3 },
            use_max: { type: 'bool', id: 4 },
            sat_per_vbyte: { type: 'uint64', id: 5 },
            target_conf: { type: 'int32', id: 6 },
            addr: { type: 'string', id: 7 },
            force_low_fee: { type: 'bool', id: 8 },
          },
        },
        SpliceUpdate: {
          fields: {
            state: { type: 'string', id: 1 },
            txid: { type: 'string', id: 2 },
            new_channel_point: { type: 'string', id: 3 },
            confirmations: { type: 'uint32', id: 4 },
            reason: { type: 'string', id: 5 },
            reason_from_peer: { type: 'bool', id: 6 },
          },
        },
      },
    },
  },
};
