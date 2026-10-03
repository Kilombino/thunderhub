import { gql } from '@apollo/client';

export const PREPARE_COIN_CONTROL_CHANNEL = gql`
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

export const CONFIRM_COIN_CONTROL_CHANNEL = gql`
  mutation ConfirmCoinControlChannel($pending_channel_id: String!) {
    confirmCoinControlChannel(pending_channel_id: $pending_channel_id) {
      transaction_id
      fee
      vsize
      fee_rate
    }
  }
`;

export const CANCEL_COIN_CONTROL_CHANNEL = gql`
  mutation CancelCoinControlChannel($pending_channel_id: String!) {
    cancelCoinControlChannel(pending_channel_id: $pending_channel_id)
  }
`;
