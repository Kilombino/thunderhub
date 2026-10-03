export const chain = {
  title: 'Chain',
  tabs: {
    utxos: 'UTXOs',
    transactions: 'Transactions',
  },
  utxos: {
    empty: 'No UTXOs found',
    columns: {
      sats: 'Sats',
      confirmations: 'Confirmations',
      since: 'Since',
      address: 'Address',
      format: 'Format',
    },
    card: {
      address: 'Address',
      amount: 'Amount',
      addressFormat: 'Address Format:',
      confirmations: 'Confirmations: ',
      outputScript: 'Output Script: ',
      transactionId: 'Transaction Id: ',
      transactionVout: 'Transaction Vout: ',
    },
  },
  transactions: {
    empty: 'No on-chain transactions found',
    ago: '{time} ago',
    unconfirmed: 'Unconfirmed',
    columns: {
      type: 'Type',
      date: 'Date',
      sats: 'Sats',
      fee: 'Fee',
      confirmations: 'Confirmations',
      blockHeight: 'Block Height',
      outputAddresses: 'Output Addresses',
      transaction: 'Transaction',
      actions: 'Actions',
    },
  },
  cpfp: {
    action: 'Speed up (CPFP)',
    title: 'Speed up transaction (CPFP)',
    explanation:
      'Child pays for parent: the wallet spends its own output of this unconfirmed transaction in a new transaction with a higher fee, so miners take both together.',
    rbfNote:
      'Channel funding transactions can not be replaced (RBF): the channel id depends on the txid, so CPFP is the way to speed them up.',
    noWalletOutput:
      'This transaction has no output belonging to the wallet, so it can not be sped up with CPFP.',
    noWalletOutputShort: 'No wallet output',
    output: 'Wallet output used',
    parent: 'Current transaction',
    parentFee: '{fee} sats over {vsize} vB ({rate} sat/vB)',
    parentFeeUnknown: 'fee unknown (incoming), assumed 0',
    targetRate: 'Target fee rate for parent + child (sat/vB)',
    estimate:
      'Child at {childRate} sat/vB ≈ {childFee} sats. LND may spend up to {budget} sats if it has to raise the fee.',
    minWarning:
      'Most XBT pools only mine transactions paying at least 1 sat/vB.',
    submit: 'Speed up',
    success:
      'Fee bump requested: child at {childRate} sat/vB (package ≈ {packageRate} sat/vB).',
  },
};
