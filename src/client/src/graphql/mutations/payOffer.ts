import { gql } from '@apollo/client';

export const PAY_OFFER = gql`
  mutation PayOffer(
    $offer: String!
    $tokens: Float
    $quantity: Float
    $payer_note: String
    $max_fee: Float
    $max_paths: Float
  ) {
    payOffer(
      offer: $offer
      tokens: $tokens
      quantity: $quantity
      payer_note: $payer_note
      max_fee: $max_fee
      max_paths: $max_paths
    ) {
      payment_hash
      amount_msat
      fee_msat
      receipt {
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
  }
`;
