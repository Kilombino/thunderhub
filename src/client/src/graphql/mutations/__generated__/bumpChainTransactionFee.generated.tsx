import * as Types from '../../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type BumpChainTransactionFeeMutationVariables = Types.Exact<{
  transaction_id: Types.Scalars['String']['input'];
  fee_rate: Types.Scalars['Float']['input'];
}>;

export type BumpChainTransactionFeeMutation = {
  __typename?: 'Mutation';
  bumpChainTransactionFee: {
    __typename?: 'ChainFeeBump';
    transaction_id: string;
    transaction_vout: number;
    child_fee_rate: number;
    child_fee: number;
    budget: number;
    package_fee_rate: number;
    status: string;
  };
};

export const BumpChainTransactionFeeDocument = gql`
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
export type BumpChainTransactionFeeMutationFn = Apollo.MutationFunction<
  BumpChainTransactionFeeMutation,
  BumpChainTransactionFeeMutationVariables
>;

/**
 * __useBumpChainTransactionFeeMutation__
 *
 * To run a mutation, you first call `useBumpChainTransactionFeeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBumpChainTransactionFeeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [bumpChainTransactionFeeMutation, { data, loading, error }] = useBumpChainTransactionFeeMutation({
 *   variables: {
 *      transaction_id: // value for 'transaction_id'
 *      fee_rate: // value for 'fee_rate'
 *   },
 * });
 */
export function useBumpChainTransactionFeeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    BumpChainTransactionFeeMutation,
    BumpChainTransactionFeeMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    BumpChainTransactionFeeMutation,
    BumpChainTransactionFeeMutationVariables
  >(BumpChainTransactionFeeDocument, options);
}
export type BumpChainTransactionFeeMutationHookResult = ReturnType<
  typeof useBumpChainTransactionFeeMutation
>;
export type BumpChainTransactionFeeMutationResult =
  Apollo.MutationResult<BumpChainTransactionFeeMutation>;
export type BumpChainTransactionFeeMutationOptions = Apollo.BaseMutationOptions<
  BumpChainTransactionFeeMutation,
  BumpChainTransactionFeeMutationVariables
>;
