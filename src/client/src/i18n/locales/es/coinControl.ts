import type { PartialMessages } from '../../index';

export const coinControl: PartialMessages['coinControl'] = {
  intro:
    'Elige exactamente qué monedas financian el canal y paga cualquier comisión desde 0,1 sat/vB. El canal se financia con una PSBT que revisas antes de firmarla.',
  peer: 'Par',
  peerPlaceholder: 'ClavePública o ClavePública@host:puerto',
  channelSize: 'Tamaño del canal (sats)',
  useAll: 'Usar todo lo seleccionado',
  feeRate: 'Comisión (sat/vB)',
  feeRateHint: 'Mínimo 0,1 sat/vB, se admiten decimales.',
  lowFeeWarning:
    'Por debajo de 1 sat/vB la confirmación puede tardar mucho: la mayoría de pools de XBT solo minan transacciones que pagan al menos 1 sat/vB. Tu par se olvida de un canal sin confirmar tras ~2016 bloques. Puedes acelerarla después desde Cadena > Transacciones (CPFP).',
  utxos: 'Monedas a gastar',
  utxosEmpty: 'La cartera no tiene UTXOs.',
  selected: '{count} seleccionadas · {total} sats',
  unconfirmed: 'sin confirmar',
  confirmations: '{count} conf.',
  outpoint: 'Outpoint',
  addressType: 'Tipo',
  routingFees: 'Comisiones de enrutamiento (opcional)',
  prepare: 'Preparar transacción',
  insufficient: 'Las monedas seleccionadas no cubren el canal y la comisión.',
  review: {
    title: 'Revisa antes de firmar',
    expires: 'El par espera la financiación hasta las {time}.',
    inputs: 'Entradas',
    channel: 'Canal',
    change: 'Cambio (vuelve a la cartera)',
    noChange: 'Sin cambio',
    fee: 'Comisión',
    feeDetail:
      '{fee} sats · ≈{rate} sat/vB (≈{vsize} vB, pedida {requested} sat/vB)',
    peer: 'Par',
    fundingAddress: 'Dirección de financiación',
    sign: 'Firmar y abrir canal',
    cancel: 'Cancelar y liberar monedas',
    cancelled: 'Canal cancelado y monedas liberadas',
  },
  opened: 'Financiación del canal emitida: {txid}',
  openedDetail: 'Pagados {fee} sats ({rate} sat/vB en {vsize} vB).',
};
