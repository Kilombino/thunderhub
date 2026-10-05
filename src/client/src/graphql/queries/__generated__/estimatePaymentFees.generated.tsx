import * as Types from '../../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type EstimatePaymentFeesQueryVariables = Types.Exact<{
  request: Types.Scalars['String']['input'];
}>;

export type EstimatePaymentFeesQuery = {
  __typename?: 'Query';
  estimatePaymentFees: Array<{
    __typename?: 'PaymentFeeEstimate';
    channel: string;
    partner_public_key: string;
    local_balance: number;
    fee?: number | null;
    fee_mtokens?: string | null;
    hops?: number | null;
    error?: string | null;
  }>;
};

export const EstimatePaymentFeesDocument = gql`
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

/**
 * __useEstimatePaymentFeesQuery__
 *
 * To run a query within a React component, call `useEstimatePaymentFeesQuery` and pass it any options that fit your needs.
 * When your component renders, `useEstimatePaymentFeesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEstimatePaymentFeesQuery({
 *   variables: {
 *      request: // value for 'request'
 *   },
 * });
 */
export function useEstimatePaymentFeesQuery(
  baseOptions: Apollo.QueryHookOptions<
    EstimatePaymentFeesQuery,
    EstimatePaymentFeesQueryVariables
  > &
    (
      | { variables: EstimatePaymentFeesQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    EstimatePaymentFeesQuery,
    EstimatePaymentFeesQueryVariables
  >(EstimatePaymentFeesDocument, options);
}
export function useEstimatePaymentFeesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    EstimatePaymentFeesQuery,
    EstimatePaymentFeesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    EstimatePaymentFeesQuery,
    EstimatePaymentFeesQueryVariables
  >(EstimatePaymentFeesDocument, options);
}
// @ts-ignore
export function useEstimatePaymentFeesSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    EstimatePaymentFeesQuery,
    EstimatePaymentFeesQueryVariables
  >
): Apollo.UseSuspenseQueryResult<
  EstimatePaymentFeesQuery,
  EstimatePaymentFeesQueryVariables
>;
export function useEstimatePaymentFeesSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        EstimatePaymentFeesQuery,
        EstimatePaymentFeesQueryVariables
      >
): Apollo.UseSuspenseQueryResult<
  EstimatePaymentFeesQuery | undefined,
  EstimatePaymentFeesQueryVariables
>;
export function useEstimatePaymentFeesSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        EstimatePaymentFeesQuery,
        EstimatePaymentFeesQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    EstimatePaymentFeesQuery,
    EstimatePaymentFeesQueryVariables
  >(EstimatePaymentFeesDocument, options);
}
export type EstimatePaymentFeesQueryHookResult = ReturnType<
  typeof useEstimatePaymentFeesQuery
>;
export type EstimatePaymentFeesLazyQueryHookResult = ReturnType<
  typeof useEstimatePaymentFeesLazyQuery
>;
export type EstimatePaymentFeesSuspenseQueryHookResult = ReturnType<
  typeof useEstimatePaymentFeesSuspenseQuery
>;
export type EstimatePaymentFeesQueryResult = Apollo.QueryResult<
  EstimatePaymentFeesQuery,
  EstimatePaymentFeesQueryVariables
>;
