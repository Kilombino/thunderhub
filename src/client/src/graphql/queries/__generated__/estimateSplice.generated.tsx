import * as Types from '../../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type EstimateSpliceQueryVariables = Types.Exact<{
  input: Types.SpliceInput;
}>;

export type EstimateSpliceQuery = {
  __typename?: 'Query';
  estimateSplice: {
    __typename?: 'SpliceEstimate';
    fee: number;
    vbytes: number;
    sat_per_vbyte: number;
    amount: number;
    min: number;
    max_in: number;
    max_out: number;
    min_sat_per_vbyte: number;
    fee_estimate_source: string;
    anchor_reserve: number;
    new_capacity: number;
    new_local: number;
    lock_depth: number;
    destination_is_ours: boolean;
    refusal_code?: string | null;
  };
};

export const EstimateSpliceDocument = gql`
  query EstimateSplice($input: SpliceInput!) {
    estimateSplice(input: $input) {
      fee
      vbytes
      sat_per_vbyte
      amount
      min
      max_in
      max_out
      min_sat_per_vbyte
      fee_estimate_source
      anchor_reserve
      new_capacity
      new_local
      lock_depth
      destination_is_ours
      refusal_code
    }
  }
`;

/**
 * __useEstimateSpliceQuery__
 *
 * To run a query within a React component, call `useEstimateSpliceQuery` and pass it any options that fit your needs.
 * When your component renders, `useEstimateSpliceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEstimateSpliceQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useEstimateSpliceQuery(
  baseOptions: Apollo.QueryHookOptions<
    EstimateSpliceQuery,
    EstimateSpliceQueryVariables
  > &
    (
      | { variables: EstimateSpliceQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<EstimateSpliceQuery, EstimateSpliceQueryVariables>(
    EstimateSpliceDocument,
    options
  );
}
export function useEstimateSpliceLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    EstimateSpliceQuery,
    EstimateSpliceQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<EstimateSpliceQuery, EstimateSpliceQueryVariables>(
    EstimateSpliceDocument,
    options
  );
}
// @ts-ignore
export function useEstimateSpliceSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    EstimateSpliceQuery,
    EstimateSpliceQueryVariables
  >
): Apollo.UseSuspenseQueryResult<
  EstimateSpliceQuery,
  EstimateSpliceQueryVariables
>;
export function useEstimateSpliceSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        EstimateSpliceQuery,
        EstimateSpliceQueryVariables
      >
): Apollo.UseSuspenseQueryResult<
  EstimateSpliceQuery | undefined,
  EstimateSpliceQueryVariables
>;
export function useEstimateSpliceSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        EstimateSpliceQuery,
        EstimateSpliceQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    EstimateSpliceQuery,
    EstimateSpliceQueryVariables
  >(EstimateSpliceDocument, options);
}
export type EstimateSpliceQueryHookResult = ReturnType<
  typeof useEstimateSpliceQuery
>;
export type EstimateSpliceLazyQueryHookResult = ReturnType<
  typeof useEstimateSpliceLazyQuery
>;
export type EstimateSpliceSuspenseQueryHookResult = ReturnType<
  typeof useEstimateSpliceSuspenseQuery
>;
export type EstimateSpliceQueryResult = Apollo.QueryResult<
  EstimateSpliceQuery,
  EstimateSpliceQueryVariables
>;
