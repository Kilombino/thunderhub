import type { PartialMessages } from '../../index';

export const splice: PartialMessages['splice'] = {
  tab: 'Cambiar tamaño',
  title: 'Cambiar el tamaño de los canales (splicing)',
  intro:
    'El splicing cambia el tamaño de un canal abierto sin cerrarlo. Aumentar mete sats del monedero on-chain en el canal; reducir saca sats de tu lado del canal a una dirección on-chain. Reducir es la forma de sacar sats de un canal sin cerrarlo.',
  action: 'Cambiar tamaño',
  actionTooltip: 'Cambiar el tamaño de este canal (aumentar / reducir)',
  refresh: 'Actualizar',
  loadError: 'No se pudo leer el estado del splicing: {error}',
  channelNotFound: 'Este canal ya no está en la lista de canales del nodo.',
  node: {
    title: 'Splicing en este nodo',
    enabled: 'Activado',
    disabled: 'Desactivado',
    enabledText:
      'Este nodo tiene el splicing activado (bit de funcionalidad "splice"). Que un canal se pueda redimensionar depende también del peer: tiene que soportar splicing y estar conectado.',
    disabledText:
      'El splicing está desactivado en este nodo. ThunderHub no puede cambiar la configuración de LND: para activarlo, añade esta línea a lnd.conf, en la sección [protocol], y reinicia LND.',
    copy: 'Copiar',
    copied: 'Copiado',
    restartWarning:
      'Reiniciar LND deja el nodo fuera de línea un momento: todos los canales pasan a inactivos y se paran los pagos y reenvíos hasta que LND arranca y los peers vuelven a conectar.',
    summary:
      '{ready} canales listos, {unsupported} cuyo peer no soporta splicing, {offline} con el peer desconectado, {other} que ahora no se pueden.',
  },
  columns: {
    peer: 'Peer',
    capacity: 'Capacidad',
    local: 'Mi saldo',
    status: 'Splicing',
    progress: 'Splice',
  },
  empty: 'No hay canales abiertos.',
  status: {
    ok: 'Se puede redimensionar',
    disabled: 'El splicing está desactivado en este nodo',
    peer_offline: 'El peer está desconectado',
    peer_unsupported: 'El peer no soporta splicing',
    no_unified_sigs:
      'El canal no se abrió con firmas unificadas (unified_sigs)',
    taproot: 'Los canales taproot aún no se pueden redimensionar',
    zero_conf: 'Los canales zero-conf no se pueden redimensionar',
    pending: 'Ya hay un splice en curso',
    closing: 'El canal se está cerrando',
    funding_spent_unknown:
      'La salida de financiación la gastó una transacción desconocida',
    peer_not_locked:
      'El peer aún no ha confirmado (splice_locked) el splice anterior',
    peer_misbehaved: 'El peer se portó mal en un splice anterior',
    peer_not_announcing:
      'Se puede redimensionar (el peer no anunció el último splice, lo que no impide uno nuevo)',
    unknown: 'Ahora no ({code})',
  },
  pending: {
    title: 'Splice en curso',
    state: 'Estado',
    confirmations: 'Confirmaciones',
    confirmationsValue: '{confirmations} de {depth}',
    newCapacity: 'Capacidad nueva',
    localDelta: 'Cambio en mi saldo',
    fee: 'Comisión',
    feeValue: '{fee} sats ({rate} sat/vB)',
    txid: 'Transacción',
    relay: 'Difusión',
    lockedLabel: 'splice_locked enviado',
    locked: 'yo: {we}, peer: {peer}',
    yes: 'sí',
    no: 'no',
    dead: 'Este splice ya no puede confirmarse (una entrada se gastó en otra transacción). El canal sigue funcionando sobre su salida de financiación anterior.',
    startedBy: 'Iniciado por',
  },
  states: {
    preparing: 'Preparando',
    negotiating: 'Negociando con el peer',
    signed: 'Firmado',
    broadcast: 'Difundido',
    confirmed: 'Confirmado, esperando la profundidad de bloqueo',
    locked: 'Bloqueado',
    aborted: 'Abortado',
    dead: 'Muerto',
  },
  relay: {
    in_mempool: 'En la mempool',
    rejected: 'Rechazada: {reason}',
    unknown: 'Desconocido',
  },
  initiator: {
    local: 'yo',
    remote: 'el peer',
    both: 'los dos',
    unknown: 'desconocido',
  },
  last: {
    title: 'Último splice',
    outcome: 'Resultado',
    when: 'Cuándo',
    peerSaid: 'El peer dijo: «{reason}»',
  },
  form: {
    direction: 'Operación',
    increase: 'Aumentar',
    reduce: 'Reducir',
    increaseHelp:
      'Mete sats del monedero on-chain del nodo en el canal. La comisión se paga desde el monedero.',
    reduceHelp:
      'Saca sats de tu lado del canal a una dirección on-chain, sin cerrarlo. La comisión sale del canal.',
    amount: 'Importe',
    amountPlaceholder: 'Sats',
    max: 'Máx',
    address: 'Dirección de destino',
    addressPlaceholder: 'Vacío: una dirección nueva del monedero del nodo',
    closeAddress:
      'Este canal tiene una dirección de cierre fijada (upfront shutdown): los sats que saques solo pueden ir a {address}. Deja la dirección vacía.',
    fee: 'Comisión on-chain',
    feeTarget: 'Objetivo de confirmación',
    feeRate: 'sat/vB',
    targetPlaceholder: 'Bloques (por defecto 6)',
    ratePlaceholder: 'sat/vB enteros',
    forceLowFee:
      'Forzar una comisión por debajo del mínimo del nodo (nunca por debajo del de difusión)',
    estimate: 'Calcular',
    estimating: 'Calculando...',
    review: 'Revisar y confirmar',
    back: 'Atrás',
    confirm: 'Confirmar splice',
    confirming: 'Iniciando el splice...',
    close: 'Cerrar',
    invalidAmount: 'Pon un número entero de sats o elige máx',
    invalidRate: 'La comisión tiene que ser un número entero de sat/vB',
  },
  estimate: {
    title: 'Estimación',
    fee: 'Comisión',
    feeValue: '{fee} sats ({rate} sat/vB, {vbytes} vB)',
    amount: 'Importe',
    capacity: 'Capacidad',
    local: 'Mi saldo',
    lockDepth: 'Confirmaciones para bloquear',
    limits: 'Mín / máx',
    minRate: 'Comisión mínima',
    minRateValue: '{rate} sat/vB ({source})',
    sourceEstimate: 'estimación de comisiones',
    sourceRelay: 'mínimo de difusión',
    anchorReserve: 'Se queda en el monedero para anchors',
    destination: 'Destino',
    ownWallet: 'Monedero de este nodo',
    external: 'Dirección externa',
    feeNoteOut: 'La comisión sale del canal.',
    feeNoteIn: 'La comisión se paga desde el monedero on-chain.',
    forcedLowFee:
      'La comisión está por debajo del mínimo del nodo: solo seguirá porque lo has forzado.',
  },
  confirm: {
    title: 'Confirmar el splice',
    increase: 'Meter {amount} sats del monedero en el canal con {peer}.',
    increaseMax:
      'Meter todo lo que el monedero puede gastar en el canal con {peer}.',
    reduce: 'Sacar {amount} sats del canal con {peer} a {address}.',
    reduceMax:
      'Sacar todo lo que permite tu saldo del canal con {peer} a {address}.',
    ownWallet: 'una dirección nueva del monedero del nodo',
    warning:
      'Esto mueve fondos reales on-chain. El canal sigue funcionando durante el splice; el tamaño nuevo vale cuando la transacción tenga {depth} confirmaciones.',
  },
  result: {
    started: 'Splice iniciado',
    agreed:
      'El peer aceptó y la transacción está firmada. El splice sigue solo: se bloquea tras las confirmaciones.',
    stillRunning:
      'Aún no hay respuesta del peer (último estado: {state}). Puede que el splice siga en marcha en el nodo: vuelve a mirar esta página en unos minutos.',
    aborted: 'El splice se abortó',
    reason: 'Motivo',
    txid: 'Transacción',
    newChannelPoint: 'Nuevo channel point',
  },
  reasons: {
    insufficient_funds: 'El monedero on-chain no tiene fondos suficientes.',
    immature_inputs:
      'El monedero solo tiene monedas que aún no se pueden gastar (coinbase sin madurar o sin confirmar).',
    below_min: 'El importe está por debajo del mínimo (polvo o reservas).',
    above_max_out:
      'No puedes sacar tanto: supera lo que permite tu saldo tras la comisión y las reservas.',
    fee_below_floor:
      'La comisión está por debajo del mínimo del nodo. Súbela o marca "forzar".',
    reserve_on_change:
      'El cambio se comería la reserva del monedero para los canales anchor.',
    close_address_set:
      'Este canal tiene una dirección de cierre fijada: los sats solo pueden salir a ella. Deja la dirección vacía.',
    node_cap: 'Se ha alcanzado el límite de splices del nodo.',
    too_many_splices: 'Demasiados splices de este canal en poco tiempo.',
    too_many_aborts:
      'Demasiados splices abortados en este canal últimamente; prueba más tarde.',
    not_quiescent: 'No se pudo pausar el canal para negociar el splice.',
    above_max_size: 'El canal superaría el tamaño máximo de canal.',
    above_balance: 'El importe supera el saldo disponible.',
    chain_not_synced: 'El nodo no está sincronizado con la cadena.',
    timeout: 'Se agotó el tiempo de la negociación con el peer.',
    rbf_unsupported: 'El peer no soporta reemplazar la transacción.',
    invalid_commitment: 'El peer envió un compromiso no válido.',
    invalid_signatures: 'El peer envió firmas no válidas.',
    locktime: 'Problema con el locktime de la transacción.',
    internal_error: 'Error interno del nodo.',
    peer_contribution_unsupported:
      'El peer intentó meter fondos propios, y eso no está soportado.',
    peer_disconnected: 'El peer se desconectó durante el splice.',
    unknown: 'No es posible: {code}',
  },
};
