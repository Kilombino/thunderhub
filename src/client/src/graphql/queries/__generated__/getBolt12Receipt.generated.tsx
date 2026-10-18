import * as Types from '../../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetBolt12ReceiptQueryVariables = Types.Exact<{
  payment_hash: Types.Scalars['String']['input'];
}>;

export type GetBolt12ReceiptQuery = {
  __typename?: 'Query';
  getBolt12Receipt?: {
    __typename?: 'Bolt12Receipt';
    payment_hash: string;
    payment_preimage: string;
    preimage_matches: boolean;
    offer: string;
    offer_id?: string | null;
    description?: string | null;
    issuer?: string | null;
    invoice: string;
    invoice_signature_valid: boolean;
    invoice_node_id?: string | null;
    payer_id?: string | null;
    payer_note?: string | null;
    amount_msat: string;
    fee_msat: string;
    paid_at: string;
    chains: Array<string>;
    saved: boolean;
  } | null;
};

export const GetBolt12ReceiptDocument = gql`
  query GetBolt12Receipt($payment_hash: String!) {
    getBolt12Receipt(payment_hash: $payment_hash) {
      payment_hash
      payment_preimage
      preimage_matches
      offer
      offer_id
      description
      issuer
      invoice
      invoice_signature_valid
      invoice_node_id
      payer_id
      payer_note
      amount_msat
      fee_msat
      paid_at
      chains
      saved
    }
  }
`;

/**
 * __useGetBolt12ReceiptQuery__
 *
 * To run a query within a React component, call `useGetBolt12ReceiptQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBolt12ReceiptQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBolt12ReceiptQuery({
 *   variables: {
 *      payment_hash: // value for 'payment_hash'
 *   },
 * });
 */
export function useGetBolt12ReceiptQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetBolt12ReceiptQuery,
    GetBolt12ReceiptQueryVariables
  > &
    (
      | { variables: GetBolt12ReceiptQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetBolt12ReceiptQuery, GetBolt12ReceiptQueryVariables>(
    GetBolt12ReceiptDocument,
    options
  );
}
export function useGetBolt12ReceiptLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetBolt12ReceiptQuery,
    GetBolt12ReceiptQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetBolt12ReceiptQuery,
    GetBolt12ReceiptQueryVariables
  >(GetBolt12ReceiptDocument, options);
}
// @ts-ignore
export function useGetBolt12ReceiptSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetBolt12ReceiptQuery,
    GetBolt12ReceiptQueryVariables
  >
): Apollo.UseSuspenseQueryResult<
  GetBolt12ReceiptQuery,
  GetBolt12ReceiptQueryVariables
>;
export function useGetBolt12ReceiptSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetBolt12ReceiptQuery,
        GetBolt12ReceiptQueryVariables
      >
): Apollo.UseSuspenseQueryResult<
  GetBolt12ReceiptQuery | undefined,
  GetBolt12ReceiptQueryVariables
>;
export function useGetBolt12ReceiptSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetBolt12ReceiptQuery,
        GetBolt12ReceiptQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetBolt12ReceiptQuery,
    GetBolt12ReceiptQueryVariables
  >(GetBolt12ReceiptDocument, options);
}
export type GetBolt12ReceiptQueryHookResult = ReturnType<
  typeof useGetBolt12ReceiptQuery
>;
export type GetBolt12ReceiptLazyQueryHookResult = ReturnType<
  typeof useGetBolt12ReceiptLazyQuery
>;
export type GetBolt12ReceiptSuspenseQueryHookResult = ReturnType<
  typeof useGetBolt12ReceiptSuspenseQuery
>;
export type GetBolt12ReceiptQueryResult = Apollo.QueryResult<
  GetBolt12ReceiptQuery,
  GetBolt12ReceiptQueryVariables
>;
