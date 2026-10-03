import { useState } from 'react';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Price } from '@/components/price/Price';
import { shorten } from '@/components/generic/helpers';
import { GetChainTransactionsQuery } from '@/graphql/queries/__generated__/getChainTransactions.generated';
import { useBumpChainTransactionFeeMutation } from '@/graphql/mutations/__generated__/bumpChainTransactionFee.generated';
import { getErrorContent } from '@/utils/error';
import { useTranslation } from '@/i18n';
import { parseFeeRate } from '../../home/liquidity/coinControl';

type ChainTx = GetChainTransactionsQuery['getChainTransactions'][number];

// Mirrors the server estimate for a one-input, one-output CPFP child.
const CHILD_VBYTES = 111;

const estimateChild = (
  parentVsize: number,
  parentFee: number,
  target: number
) => {
  const needed = target * (parentVsize + CHILD_VBYTES) - parentFee;
  const childRate = Math.max(1, Math.ceil(needed / CHILD_VBYTES));
  const childFee = childRate * CHILD_VBYTES;
  return { childRate, childFee, budget: Math.ceil(childFee * 1.5) };
};

export const CpfpDialog = ({
  transaction,
  onClose,
}: {
  transaction: ChainTx | null;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const [rateInput, setRateInput] = useState('2');

  const [bump, { loading }] = useBumpChainTransactionFeeMutation({
    onError: error => toast.error(getErrorContent(error)),
    onCompleted: ({ bumpChainTransactionFee: result }) => {
      toast.success(
        t('chain.cpfp.success', {
          childRate: result.child_fee_rate,
          packageRate: result.package_fee_rate,
        }),
        { duration: 8_000 }
      );
      onClose();
    },
    refetchQueries: ['GetChainTransactions', 'GetUtxos'],
  });

  if (!transaction) return null;

  const target = parseFeeRate(rateInput);
  const validTarget = target >= 1 && target <= 10_000;
  const parentVsize = transaction.vsize || 0;
  const parentFee =
    transaction.is_outgoing && transaction.fee ? transaction.fee : 0;
  const estimate =
    validTarget && parentVsize
      ? estimateChild(parentVsize, parentFee, target)
      : null;

  return (
    <Dialog open={!!transaction} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('chain.cpfp.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">{t('chain.cpfp.explanation')}</p>

          <div className="flex items-start gap-2 rounded border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>{t('chain.cpfp.rbfNote')}</span>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">
                {t('chain.cpfp.parent')}
              </span>
              <span className="font-mono">
                {shorten(transaction.id)} ·{' '}
                {parentFee
                  ? t('chain.cpfp.parentFee', {
                      fee: parentFee,
                      vsize: parentVsize,
                      rate:
                        Math.round((parentFee / (parentVsize || 1)) * 1000) /
                        1000,
                    })
                  : t('chain.cpfp.parentFeeUnknown')}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">
                {t('chain.cpfp.output')}
              </span>
              <span className="font-mono">
                {shorten(transaction.id)}:{transaction.cpfp_vout} ·{' '}
                <Price amount={transaction.cpfp_tokens} />
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t('chain.cpfp.targetRate')}
            </label>
            <Input
              inputMode="decimal"
              value={rateInput}
              onChange={e => setRateInput(e.target.value)}
              aria-invalid={!validTarget}
            />
            <span className="text-xs text-muted-foreground">
              {t('chain.cpfp.minWarning')}
            </span>
          </div>

          {estimate && (
            <div className="flex items-start gap-2 rounded border border-orange-500/30 bg-orange-500/5 p-3 text-xs text-muted-foreground">
              <AlertTriangle
                size={14}
                className="mt-0.5 shrink-0 text-orange-500"
              />
              <span>{t('chain.cpfp.estimate', estimate)}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={loading} onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={!validTarget || loading}
            onClick={() =>
              bump({
                variables: {
                  transaction_id: transaction.id,
                  fee_rate: target,
                },
              })
            }
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              t('chain.cpfp.submit')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
