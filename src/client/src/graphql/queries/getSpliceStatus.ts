import { gql } from '@apollo/client';

export const GET_SPLICE_STATUS = gql`
  query GetSpliceStatus {
    getSpliceStatus {
      node_enabled
      channels {
        id
        channel_point
        original_channel_point
        original_id
        partner_public_key
        peer_alias
        is_active
        is_private
        capacity
        local_balance
        remote_balance
        close_address
        unified_sigs
        splice_status
        can_splice
        pending_splice {
          initiator
          state
          local_delta
          remote_delta
          fee
          our_fee
          sat_per_vbyte
          txid
          broadcast_height
          confirmations
          lock_depth
          we_locked
          peer_locked
          dead
          relay_status
          relay_reason
          new_channel_point
          new_capacity
        }
        last_splice {
          initiator
          local_delta
          remote_delta
          txid
          time
          outcome
          reason
          reason_from_peer
        }
      }
    }
  }
`;
