import { gql } from '@apollo/client';

export const BUMP_CHAIN_TRANSACTION_FEE = gql`
  mutation BumpChainTransactionFee(
    $transaction_id: String!
    $fee_rate: Float!
  ) {
    bumpChainTransactionFee(
      transaction_id: $transaction_id
      fee_rate: $fee_rate
    ) {
      transaction_id
      transaction_vout
      child_fee_rate
      child_fee
      budget
      package_fee_rate
      status
    }
  }
`;
