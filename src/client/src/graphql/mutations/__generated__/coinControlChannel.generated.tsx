import * as Types from '../../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type PrepareCoinControlChannelMutationVariables = Types.Exact<{
  input: Types.PrepareCoinControlChannelInput;
}>;

export type PrepareCoinControlChannelMutation = {
  __typename?: 'Mutation';
  prepareCoinControlChannel: {
    __typename?: 'CoinControlChannelProposal';
    pending_channel_id: string;
    partner_public_key: string;
    funding_address: string;
    expires_at: string;
    input_total: number;
    channel_amount: number;
    change: number;
    fee: number;
    estimated_vsize: number;
    estimated_fee_rate: number;
    requested_fee_rate: number;
    sat_per_kw: number;
    inputs: Array<{
      __typename?: 'CoinControlInput';
      transaction_id: string;
      transaction_vout: number;
      tokens: number;
    }>;
  };
};

export type ConfirmCoinControlChannelMutationVariables = Types.Exact<{
  pending_channel_id: Types.Scalars['String']['input'];
}>;

export type ConfirmCoinControlChannelMutation = {
  __typename?: 'Mutation';
  confirmCoinControlChannel: {
    __typename?: 'CoinControlChannelResult';
    transaction_id: string;
    fee: number;
    vsize: number;
    fee_rate: number;
  };
};

export type CancelCoinControlChannelMutationVariables = Types.Exact<{
  pending_channel_id: Types.Scalars['String']['input'];
}>;

export type CancelCoinControlChannelMutation = {
  __typename?: 'Mutation';
  cancelCoinControlChannel: boolean;
};

export const PrepareCoinControlChannelDocument = gql`
  mutation PrepareCoinControlChannel($input: PrepareCoinControlChannelInput!) {
    prepareCoinControlChannel(input: $input) {
      pending_channel_id
      partner_public_key
      funding_address
      expires_at
      inputs {
        transaction_id
        transaction_vout
        tokens
      }
      input_total
      channel_amount
      change
      fee
      estimated_vsize
      estimated_fee_rate
      requested_fee_rate
      sat_per_kw
    }
  }
`;
export type PrepareCoinControlChannelMutationFn = Apollo.MutationFunction<
  PrepareCoinControlChannelMutation,
  PrepareCoinControlChannelMutationVariables
>;

/**
 * __usePrepareCoinControlChannelMutation__
 *
 * To run a mutation, you first call `usePrepareCoinControlChannelMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePrepareCoinControlChannelMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [prepareCoinControlChannelMutation, { data, loading, error }] = usePrepareCoinControlChannelMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usePrepareCoinControlChannelMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PrepareCoinControlChannelMutation,
    PrepareCoinControlChannelMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PrepareCoinControlChannelMutation,
    PrepareCoinControlChannelMutationVariables
  >(PrepareCoinControlChannelDocument, options);
}
export type PrepareCoinControlChannelMutationHookResult = ReturnType<
  typeof usePrepareCoinControlChannelMutation
>;
export type PrepareCoinControlChannelMutationResult =
  Apollo.MutationResult<PrepareCoinControlChannelMutation>;
export type PrepareCoinControlChannelMutationOptions =
  Apollo.BaseMutationOptions<
    PrepareCoinControlChannelMutation,
    PrepareCoinControlChannelMutationVariables
  >;
export const ConfirmCoinControlChannelDocument = gql`
  mutation ConfirmCoinControlChannel($pending_channel_id: String!) {
    confirmCoinControlChannel(pending_channel_id: $pending_channel_id) {
      transaction_id
      fee
      vsize
      fee_rate
    }
  }
`;
export type ConfirmCoinControlChannelMutationFn = Apollo.MutationFunction<
  ConfirmCoinControlChannelMutation,
  ConfirmCoinControlChannelMutationVariables
>;

/**
 * __useConfirmCoinControlChannelMutation__
 *
 * To run a mutation, you first call `useConfirmCoinControlChannelMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useConfirmCoinControlChannelMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [confirmCoinControlChannelMutation, { data, loading, error }] = useConfirmCoinControlChannelMutation({
 *   variables: {
 *      pending_channel_id: // value for 'pending_channel_id'
 *   },
 * });
 */
export function useConfirmCoinControlChannelMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ConfirmCoinControlChannelMutation,
    ConfirmCoinControlChannelMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ConfirmCoinControlChannelMutation,
    ConfirmCoinControlChannelMutationVariables
  >(ConfirmCoinControlChannelDocument, options);
}
export type ConfirmCoinControlChannelMutationHookResult = ReturnType<
  typeof useConfirmCoinControlChannelMutation
>;
export type ConfirmCoinControlChannelMutationResult =
  Apollo.MutationResult<ConfirmCoinControlChannelMutation>;
export type ConfirmCoinControlChannelMutationOptions =
  Apollo.BaseMutationOptions<
    ConfirmCoinControlChannelMutation,
    ConfirmCoinControlChannelMutationVariables
  >;
export const CancelCoinControlChannelDocument = gql`
  mutation CancelCoinControlChannel($pending_channel_id: String!) {
    cancelCoinControlChannel(pending_channel_id: $pending_channel_id)
  }
`;
export type CancelCoinControlChannelMutationFn = Apollo.MutationFunction<
  CancelCoinControlChannelMutation,
  CancelCoinControlChannelMutationVariables
>;

/**
 * __useCancelCoinControlChannelMutation__
 *
 * To run a mutation, you first call `useCancelCoinControlChannelMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelCoinControlChannelMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelCoinControlChannelMutation, { data, loading, error }] = useCancelCoinControlChannelMutation({
 *   variables: {
 *      pending_channel_id: // value for 'pending_channel_id'
 *   },
 * });
 */
export function useCancelCoinControlChannelMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CancelCoinControlChannelMutation,
    CancelCoinControlChannelMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CancelCoinControlChannelMutation,
    CancelCoinControlChannelMutationVariables
  >(CancelCoinControlChannelDocument, options);
}
export type CancelCoinControlChannelMutationHookResult = ReturnType<
  typeof useCancelCoinControlChannelMutation
>;
export type CancelCoinControlChannelMutationResult =
  Apollo.MutationResult<CancelCoinControlChannelMutation>;
export type CancelCoinControlChannelMutationOptions =
  Apollo.BaseMutationOptions<
    CancelCoinControlChannelMutation,
    CancelCoinControlChannelMutationVariables
  >;
