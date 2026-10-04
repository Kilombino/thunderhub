import { gql } from '@apollo/client';

export const DECODE_BOLT12 = gql`
  query DecodeBolt12($bolt12: String!) {
    decodeBolt12(bolt12: $bolt12) {
      type
      for_this_chain
      valid
      validation_error
      ours
      offer {
        offer_id
        description
        issuer
        amount_msat
        absolute_expiry
        issuer_id
        num_paths
        quantity_max
        quantity_any
      }
    }
  }
`;
