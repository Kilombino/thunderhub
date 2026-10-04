import * as Types from '../../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type PayOfferMutationVariables = Types.Exact<{
  offer: Types.Scalars['String']['input'];
  tokens?: Types.InputMaybe<Types.Scalars['Float']['input']>;
  quantity?: Types.InputMaybe<Types.Scalars['Float']['input']>;
  payer_note?: Types.InputMaybe<Types.Scalars['String']['input']>;
  max_fee?: Types.InputMaybe<Types.Scalars['Float']['input']>;
  max_paths?: Types.InputMaybe<Types.Scalars['Float']['input']>;
}>;

export type PayOfferMutation = {
  __typename?: 'Mutation';
  payOffer: {
    __typename?: 'PayOfferResult';
    payment_hash: string;
    amount_msat: string;
    fee_msat: string;
  };
};

export const PayOfferDocument = gql`
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
export type PayOfferMutationFn = Apollo.MutationFunction<
  PayOfferMutation,
  PayOfferMutationVariables
>;

/**
 * __usePayOfferMutation__
 *
 * To run a mutation, you first call `usePayOfferMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePayOfferMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [payOfferMutation, { data, loading, error }] = usePayOfferMutation({
 *   variables: {
 *      offer: // value for 'offer'
 *      tokens: // value for 'tokens'
 *      quantity: // value for 'quantity'
 *      payer_note: // value for 'payer_note'
 *      max_fee: // value for 'max_fee'
 *      max_paths: // value for 'max_paths'
 *   },
 * });
 */
export function usePayOfferMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PayOfferMutation,
    PayOfferMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<PayOfferMutation, PayOfferMutationVariables>(
    PayOfferDocument,
    options
  );
}
export type PayOfferMutationHookResult = ReturnType<typeof usePayOfferMutation>;
export type PayOfferMutationResult = Apollo.MutationResult<PayOfferMutation>;
export type PayOfferMutationOptions = Apollo.BaseMutationOptions<
  PayOfferMutation,
  PayOfferMutationVariables
>;
