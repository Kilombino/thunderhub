import type { PartialMessages } from '../../index';

export const chain: PartialMessages['chain'] = {
  title: 'Cadena',
  tabs: {
    utxos: 'UTXOs',
    transactions: 'Transacciones',
  },
  utxos: {
    empty: 'No hay UTXOs',
    columns: {
      sats: 'Sats',
      confirmations: 'Confirmaciones',
      since: 'Desde',
      address: 'Dirección',
      format: 'Formato',
    },
    card: {
      address: 'Dirección',
      amount: 'Importe',
      addressFormat: 'Formato de dirección:',
      confirmations: 'Confirmaciones: ',
      outputScript: 'Script de salida: ',
      transactionId: 'Id de transacción: ',
      transactionVout: 'Salida (vout): ',
    },
  },
  transactions: {
    empty: 'No hay transacciones on-chain',
    ago: 'hace {time}',
    unconfirmed: 'Sin confirmar',
    columns: {
      type: 'Tipo',
      date: 'Fecha',
      sats: 'Sats',
      fee: 'Comisión',
      confirmations: 'Confirmaciones',
      blockHeight: 'Altura de bloque',
      outputAddresses: 'Direcciones de salida',
      transaction: 'Transacción',
      actions: 'Acciones',
    },
  },
  cpfp: {
    action: 'Acelerar (CPFP)',
    title: 'Acelerar transacción (CPFP)',
    explanation:
      'El hijo paga por el padre: la cartera gasta su propia salida de esta transacción sin confirmar en una nueva transacción con más comisión, y los mineros se llevan las dos juntas.',
    rbfNote:
      'Las transacciones de apertura de canal no se pueden reemplazar (RBF): el id del canal depende del txid, así que la forma de acelerarlas es CPFP.',
    noWalletOutput:
      'Esta transacción no tiene ninguna salida de la cartera, así que no se puede acelerar con CPFP.',
    noWalletOutputShort: 'Sin salida propia',
    output: 'Salida de la cartera que se usa',
    parent: 'Transacción actual',
    parentFee: '{fee} sats en {vsize} vB ({rate} sat/vB)',
    parentFeeUnknown: 'comisión desconocida (entrante), se cuenta como 0',
    targetRate: 'Comisión objetivo para padre + hijo (sat/vB)',
    estimate:
      'Hijo a {childRate} sat/vB ≈ {childFee} sats. LND puede gastar hasta {budget} sats si tiene que subir la comisión.',
    minWarning:
      'La mayoría de pools de XBT solo minan transacciones que pagan al menos 1 sat/vB.',
    submit: 'Acelerar',
    success:
      'Aceleración solicitada: hijo a {childRate} sat/vB (paquete ≈ {packageRate} sat/vB).',
  },
};
