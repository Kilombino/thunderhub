import * as Types from '../../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type DecodeBolt12QueryVariables = Types.Exact<{
  bolt12: Types.Scalars['String']['input'];
}>;

export type DecodeBolt12Query = {
  __typename?: 'Query';
  decodeBolt12: {
    __typename?: 'DecodedBolt12';
    type: string;
    for_this_chain: boolean;
    valid: boolean;
    validation_error?: string | null;
    ours: boolean;
    offer?: {
      __typename?: 'Bolt12Offer';
      offer_id: string;
      description?: string | null;
      issuer?: string | null;
      amount_msat: string;
      absolute_expiry?: string | null;
      issuer_id?: string | null;
      num_paths: number;
      quantity_max: number;
      quantity_any: boolean;
    } | null;
  };
};

export const DecodeBolt12Document = gql`
  query DecodeBolt12($bolt12: String!) {
    decodeBolt12(bolt12: $bolt12) {
      type
      for_this_chain
      valid
      validation_error
      ours
      offer {
        offer_id
        description
        issuer
        amount_msat
        absolute_expiry
        issuer_id
        num_paths
        quantity_max
        quantity_any
      }
    }
  }
`;

/**
 * __useDecodeBolt12Query__
 *
 * To run a query within a React component, call `useDecodeBolt12Query` and pass it any options that fit your needs.
 * When your component renders, `useDecodeBolt12Query` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDecodeBolt12Query({
 *   variables: {
 *      bolt12: // value for 'bolt12'
 *   },
 * });
 */
export function useDecodeBolt12Query(
  baseOptions: Apollo.QueryHookOptions<
    DecodeBolt12Query,
    DecodeBolt12QueryVariables
  > &
    (
      | { variables: DecodeBolt12QueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<DecodeBolt12Query, DecodeBolt12QueryVariables>(
    DecodeBolt12Document,
    options
  );
}
export function useDecodeBolt12LazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    DecodeBolt12Query,
    DecodeBolt12QueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<DecodeBolt12Query, DecodeBolt12QueryVariables>(
    DecodeBolt12Document,
    options
  );
}
// @ts-ignore
export function useDecodeBolt12SuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    DecodeBolt12Query,
    DecodeBolt12QueryVariables
  >
): Apollo.UseSuspenseQueryResult<DecodeBolt12Query, DecodeBolt12QueryVariables>;
export function useDecodeBolt12SuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        DecodeBolt12Query,
        DecodeBolt12QueryVariables
      >
): Apollo.UseSuspenseQueryResult<
  DecodeBolt12Query | undefined,
  DecodeBolt12QueryVariables
>;
export function useDecodeBolt12SuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        DecodeBolt12Query,
        DecodeBolt12QueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<DecodeBolt12Query, DecodeBolt12QueryVariables>(
    DecodeBolt12Document,
    options
  );
}
export type DecodeBolt12QueryHookResult = ReturnType<
  typeof useDecodeBolt12Query
>;
export type DecodeBolt12LazyQueryHookResult = ReturnType<
  typeof useDecodeBolt12LazyQuery
>;
export type DecodeBolt12SuspenseQueryHookResult = ReturnType<
  typeof useDecodeBolt12SuspenseQuery
>;
export type DecodeBolt12QueryResult = Apollo.QueryResult<
  DecodeBolt12Query,
  DecodeBolt12QueryVariables
>;
