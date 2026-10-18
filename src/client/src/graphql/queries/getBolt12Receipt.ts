import { gql } from '@apollo/client';

export const GET_BOLT12_RECEIPT = gql`
  query GetBolt12Receipt($payment_hash: String!) {
    getBolt12Receipt(payment_hash: $payment_hash) {
      payment_hash
      payment_preimage
      preimage_matches
      offer
      offer_id
      description
      issuer
      invoice
      invoice_signature_valid
      invoice_node_id
      payer_id
      payer_note
      amount_msat
      fee_msat
      paid_at
      chains
      saved
    }
  }
`;
