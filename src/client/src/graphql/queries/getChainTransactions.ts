import { gql } from '@apollo/client';

export const GET_CHAIN_TRANSACTIONS = gql`
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
