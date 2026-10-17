import * as Types from '../../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type SpliceChannelMutationVariables = Types.Exact<{
  input: Types.SpliceInput;
}>;

export type SpliceChannelMutation = {
  __typename?: 'Mutation';
  spliceChannel: {
    __typename?: 'SpliceResult';
    state: string;
    txid?: string | null;
    new_channel_point?: string | null;
    confirmations: number;
    reason?: string | null;
    reason_from_peer: boolean;
    timed_out: boolean;
  };
};

export const SpliceChannelDocument = gql`
  mutation SpliceChannel($input: SpliceInput!) {
    spliceChannel(input: $input) {
      state
      txid
      new_channel_point
      confirmations
      reason
      reason_from_peer
      timed_out
    }
  }
`;
export type SpliceChannelMutationFn = Apollo.MutationFunction<
  SpliceChannelMutation,
  SpliceChannelMutationVariables
>;

/**
 * __useSpliceChannelMutation__
 *
 * To run a mutation, you first call `useSpliceChannelMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSpliceChannelMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [spliceChannelMutation, { data, loading, error }] = useSpliceChannelMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSpliceChannelMutation(
  baseOptions?: Apollo.MutationHookOptions<
    SpliceChannelMutation,
    SpliceChannelMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    SpliceChannelMutation,
    SpliceChannelMutationVariables
  >(SpliceChannelDocument, options);
}
export type SpliceChannelMutationHookResult = ReturnType<
  typeof useSpliceChannelMutation
>;
export type SpliceChannelMutationResult =
  Apollo.MutationResult<SpliceChannelMutation>;
export type SpliceChannelMutationOptions = Apollo.BaseMutationOptions<
  SpliceChannelMutation,
  SpliceChannelMutationVariables
>;
