import { FC, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetBolt12ReceiptLazyQuery } from '@/graphql/queries/__generated__/getBolt12Receipt.generated';
import { Bolt12ReceiptView } from '@/views/home/account/pay/Bolt12Receipt';
import { t } from '@/i18n';

/** RECEIPT for a BOLT 12 payment in the history: the proof kept when it was paid. */
export const Bolt12ReceiptLoader: FC<{ paymentHash: string }> = ({
  paymentHash,
}) => {
  const [open, setOpen] = useState(false);
  const [load, { data, loading, called }] = useGetBolt12ReceiptLazyQuery({
    fetchPolicy: 'network-only',
  });

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => {
          setOpen(true);
          load({ variables: { payment_hash: paymentHash } });
        }}
      >
        {t('wallet.bolt12Receipt.show')}
      </Button>
    );
  }
  if (loading || !called)
    return <Loader2 className="animate-spin mt-2" size={14} />;
  const receipt = data?.getBolt12Receipt;
  if (!receipt) {
    return (
      <div className="text-xs text-muted-foreground mt-2">
        {t('wallet.bolt12Receipt.none')}
      </div>
    );
  }
  return (
    <div className="mt-2">
      <Bolt12ReceiptView receipt={receipt} />
    </div>
  );
};
