import * as Types from '../../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetSpliceStatusQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type GetSpliceStatusQuery = {
  __typename?: 'Query';
  getSpliceStatus: {
    __typename?: 'SpliceStatus';
    node_enabled: boolean;
    channels: Array<{
      __typename?: 'SpliceChannelInfo';
      id: string;
      channel_point: string;
      original_channel_point: string;
      original_id: string;
      partner_public_key: string;
      peer_alias?: string | null;
      is_active: boolean;
      is_private: boolean;
      capacity: number;
      local_balance: number;
      remote_balance: number;
      close_address?: string | null;
      unified_sigs: boolean;
      splice_status: string;
      can_splice: boolean;
      pending_splice?: {
        __typename?: 'PendingSpliceInfo';
        initiator: string;
        state: string;
        local_delta: number;
        remote_delta: number;
        fee: number;
        our_fee: number;
        sat_per_vbyte: number;
        txid?: string | null;
        broadcast_height: number;
        confirmations: number;
        lock_depth: number;
        we_locked: boolean;
        peer_locked: boolean;
        dead: boolean;
        relay_status?: string | null;
        relay_reason?: string | null;
        new_channel_point?: string | null;
        new_capacity: number;
      } | null;
      last_splice?: {
        __typename?: 'LastSpliceInfo';
        initiator: string;
        local_delta: number;
        remote_delta: number;
        txid?: string | null;
        time?: string | null;
        outcome: string;
        reason?: string | null;
        reason_from_peer: boolean;
      } | null;
    }>;
  };
};

export const GetSpliceStatusDocument = gql`
  query GetSpliceStatus {
    getSpliceStatus {
      node_enabled
      channels {
        id
        channel_point
        original_channel_point
        original_id
        partner_public_key
        peer_alias
        is_active
        is_private
        capacity
        local_balance
        remote_balance
        close_address
        unified_sigs
        splice_status
        can_splice
        pending_splice {
          initiator
          state
          local_delta
          remote_delta
          fee
          our_fee
          sat_per_vbyte
          txid
          broadcast_height
          confirmations
          lock_depth
          we_locked
          peer_locked
          dead
          relay_status
          relay_reason
          new_channel_point
          new_capacity
        }
        last_splice {
          initiator
          local_delta
          remote_delta
          txid
          time
          outcome
          reason
          reason_from_peer
        }
      }
    }
  }
`;

/**
 * __useGetSpliceStatusQuery__
 *
 * To run a query within a React component, call `useGetSpliceStatusQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSpliceStatusQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSpliceStatusQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetSpliceStatusQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetSpliceStatusQuery,
    GetSpliceStatusQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetSpliceStatusQuery, GetSpliceStatusQueryVariables>(
    GetSpliceStatusDocument,
    options
  );
}
export function useGetSpliceStatusLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetSpliceStatusQuery,
    GetSpliceStatusQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetSpliceStatusQuery,
    GetSpliceStatusQueryVariables
  >(GetSpliceStatusDocument, options);
}
// @ts-ignore
export function useGetSpliceStatusSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetSpliceStatusQuery,
    GetSpliceStatusQueryVariables
  >
): Apollo.UseSuspenseQueryResult<
  GetSpliceStatusQuery,
  GetSpliceStatusQueryVariables
>;
export function useGetSpliceStatusSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetSpliceStatusQuery,
        GetSpliceStatusQueryVariables
      >
): Apollo.UseSuspenseQueryResult<
  GetSpliceStatusQuery | undefined,
  GetSpliceStatusQueryVariables
>;
export function useGetSpliceStatusSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetSpliceStatusQuery,
        GetSpliceStatusQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetSpliceStatusQuery,
    GetSpliceStatusQueryVariables
  >(GetSpliceStatusDocument, options);
}
export type GetSpliceStatusQueryHookResult = ReturnType<
  typeof useGetSpliceStatusQuery
>;
export type GetSpliceStatusLazyQueryHookResult = ReturnType<
  typeof useGetSpliceStatusLazyQuery
>;
export type GetSpliceStatusSuspenseQueryHookResult = ReturnType<
  typeof useGetSpliceStatusSuspenseQuery
>;
export type GetSpliceStatusQueryResult = Apollo.QueryResult<
  GetSpliceStatusQuery,
  GetSpliceStatusQueryVariables
>;
