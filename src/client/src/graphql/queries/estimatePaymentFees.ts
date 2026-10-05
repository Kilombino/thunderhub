import { gql } from '@apollo/client';

export const ESTIMATE_PAYMENT_FEES = gql`
  query EstimatePaymentFees($request: String!) {
    estimatePaymentFees(request: $request) {
      channel
      partner_public_key
      local_balance
      fee
      fee_mtokens
      hops
      error
    }
  }
`;
