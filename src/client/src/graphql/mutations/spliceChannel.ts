import { gql } from '@apollo/client';

export const SPLICE_CHANNEL = gql`
  mutation SpliceChannel($input: SpliceInput!) {
    spliceChannel(input: $input) {
      state
      txid
      new_channel_point
      confirmations
      reason
      reason_from_peer
      timed_out
    }
  }
`;
