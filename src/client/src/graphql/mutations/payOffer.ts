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
    }
  }
`;
