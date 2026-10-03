import * as Types from '../../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetChainTransactionsQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type GetChainTransactionsQuery = {
  __typename?: 'Query';
  getChainTransactions: Array<{
    __typename?: 'ChainTransaction';
    block_id?: string | null;
    confirmation_count?: number | null;
    confirmation_height?: number | null;
    created_at: string;
    fee?: number | null;
    id: string;
    is_confirmed: boolean;
    is_outgoing: boolean;
    output_addresses: Array<string>;
    tokens: number;
    vsize?: number | null;
    cpfp_vout?: number | null;
    cpfp_tokens?: number | null;
  }>;
};

export const GetChainTransactionsDocument = gql`
  query GetChainTransactions {
    getChainTransactions {
      block_id
      confirmation_count
      confirmation_height
      created_at
      fee
      id
      is_confirmed
      is_outgoing
      output_addresses
      tokens
      vsize
      cpfp_vout
      cpfp_tokens
    }
  }
`;

/**
 * __useGetChainTransactionsQuery__
 *
 * To run a query within a React component, call `useGetChainTransactionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetChainTransactionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetChainTransactionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetChainTransactionsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetChainTransactionsQuery,
    GetChainTransactionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetChainTransactionsQuery,
    GetChainTransactionsQueryVariables
  >(GetChainTransactionsDocument, options);
}
export function useGetChainTransactionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetChainTransactionsQuery,
    GetChainTransactionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetChainTransactionsQuery,
    GetChainTransactionsQueryVariables
  >(GetChainTransactionsDocument, options);
}
// @ts-ignore
export function useGetChainTransactionsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetChainTransactionsQuery,
    GetChainTransactionsQueryVariables
  >
): Apollo.UseSuspenseQueryResult<
  GetChainTransactionsQuery,
  GetChainTransactionsQueryVariables
>;
export function useGetChainTransactionsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetChainTransactionsQuery,
        GetChainTransactionsQueryVariables
      >
): Apollo.UseSuspenseQueryResult<
  GetChainTransactionsQuery | undefined,
  GetChainTransactionsQueryVariables
>;
export function useGetChainTransactionsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetChainTransactionsQuery,
        GetChainTransactionsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetChainTransactionsQuery,
    GetChainTransactionsQueryVariables
  >(GetChainTransactionsDocument, options);
}
export type GetChainTransactionsQueryHookResult = ReturnType<
  typeof useGetChainTransactionsQuery
>;
export type GetChainTransactionsLazyQueryHookResult = ReturnType<
  typeof useGetChainTransactionsLazyQuery
>;
export type GetChainTransactionsSuspenseQueryHookResult = ReturnType<
  typeof useGetChainTransactionsSuspenseQuery
>;
export type GetChainTransactionsQueryResult = Apollo.QueryResult<
  GetChainTransactionsQuery,
  GetChainTransactionsQueryVariables
>;
