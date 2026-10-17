import { gql } from '@apollo/client';

export const ESTIMATE_SPLICE = gql`
  query EstimateSplice($input: SpliceInput!) {
    estimateSplice(input: $input) {
      fee
      vbytes
      sat_per_vbyte
      amount
      min
      max_in
      max_out
      min_sat_per_vbyte
      fee_estimate_source
      anchor_reserve
      new_capacity
      new_local
      lock_depth
      destination_is_ours
      refusal_code
    }
  }
`;
