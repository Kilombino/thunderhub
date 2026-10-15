import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useCreateAddressMutation } from '../../../../graphql/mutations/__generated__/createAddress.generated';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, ChevronRight, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { getErrorContent } from '../../../../utils/error';
import { Button } from '@/components/ui/button';
import { SmallSelectWithValue } from '../../../../components/select';
import { t } from '@/i18n';
import { useSseEvent } from '../../../../hooks/useSse';
import { formatSats } from '../../../../utils/helpers';

const getOptions = () => [
  { label: t('wallet.receiveOnChain.typeP2tr'), value: 'p2tr' },
  { label: t('wallet.receiveOnChain.typeP2wpkh'), value: 'p2wpkh' },
  { label: t('wallet.receiveOnChain.typeNp2wpkh'), value: 'np2wpkh' },
];

export const ReceiveOnChainCard = () => {
  const options = getOptions();
  const [type, setType] = useState(options[0]);
  const [received, setReceived] = useState(false);

  const [createAddress, { data, loading }] = useCreateAddressMutation({
    onError: error => toast.error(getErrorContent(error)),
  });

  useEffect(() => {
    if (data?.createAddress) setReceived(true);
  }, [data]);

  // A payment to the address shown, as soon as the node sees it.
  const address = data?.createAddress;
  const [incoming, setIncoming] = useState<{
    tokens: number;
    confirmed: boolean;
  } | null>(null);
  const onChainTx = useCallback(
    (tx: any) => {
      if (!address || tx?.is_outgoing) return;
      if (!(tx?.output_addresses || []).includes(address)) return;
      setIncoming(prev => ({
        tokens: tx.tokens,
        confirmed: !!tx.is_confirmed || !!prev?.confirmed,
      }));
    },
    [address]
  );
  useSseEvent('chain_transaction', onChainTx);

  return (
    <>
      {data && data.createAddress ? (
        <div className="flex flex-col justify-between items-center md:flex-row">
          <div className="w-70 h-70 m-4 bg-white p-4">
            <QRCodeSVG value={data.createAddress} size={248} />
          </div>
          <div className="w-full h-full flex flex-col justify-center items-center">
            <div className="break-all m-6 text-sm">{data.createAddress}</div>
            {incoming && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  incoming.confirmed
                    ? 'bg-green-500/15 text-green-600'
                    : 'bg-amber-500/15 text-amber-600'
                }`}
              >
                {incoming.confirmed ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Clock size={18} />
                )}
                {incoming.confirmed
                  ? t('wallet.receiveOnChain.confirmed', {
                      amount: formatSats(incoming.tokens),
                    })
                  : t('wallet.receiveOnChain.incoming', {
                      amount: formatSats(incoming.tokens),
                    })}
              </div>
            )}
            <Button
              variant="outline"
              onClick={() =>
                navigator.clipboard
                  .writeText(data.createAddress)
                  .then(() =>
                    toast.success(t('wallet.receiveOnChain.addressCopied'))
                  )
              }
            >
              <Copy size={18} />
              {t('wallet.receiveOnChain.copy')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col justify-between items-center w-full md:flex-row">
            <h4 className="text-sm font-medium my-1">
              {t('wallet.receiveOnChain.addressType')}
            </h4>

            <div className="flex gap-2 flex-col md:flex-row">
              <SmallSelectWithValue
                callback={e => setType((e[0] || options[1]) as any)}
                options={options}
                value={type}
                isClearable={false}
              />

              <Button
                variant="outline"
                onClick={() =>
                  createAddress({ variables: { type: type.value } })
                }
                disabled={received || loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    {t('wallet.receiveOnChain.createAddress')}{' '}
                    <ChevronRight size={18} />
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
