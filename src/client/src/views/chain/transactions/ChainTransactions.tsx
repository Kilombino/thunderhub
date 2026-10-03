import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  GetChainTransactionsQuery,
  useGetChainTransactionsQuery,
} from '../../../graphql/queries/__generated__/getChainTransactions.generated';
import { getErrorContent } from '../../../utils/error';
import { LoadingCard } from '../../../components/loading/LoadingCard';
import Table from '../../../components/table';
import {
  getAddressLink,
  getDateDif,
  getTransactionLink,
} from '../../../components/generic/helpers';
import { Price } from '../../../components/price/Price';
import { ArrowDown, ArrowUp, ArrowUpDown, Rocket } from 'lucide-react';
import { useChartColors } from '../../../lib/chart-colors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from '@/i18n';
import { CpfpDialog } from './CpfpDialog';

type ChainTx = GetChainTransactionsQuery['getChainTransactions'][number];

export const ChainTransactions = () => {
  const { t } = useTranslation();
  const chartColors = useChartColors();
  const [bumping, setBumping] = useState<ChainTx | null>(null);

  const { loading, data } = useGetChainTransactionsQuery({
    onError: error => toast.error(getErrorContent(error)),
  });

  const tableData = useMemo(() => {
    const channelData = data?.getChainTransactions || [];

    return channelData.map(c => ({
      ...c,
      transaction_type: c.fee !== null ? 'Sent' : 'Received',
    }));
  }, [data]);

  const columns = useMemo(
    () => [
      {
        id: 'Type',
        header: t('chain.transactions.columns.type'),
        accessorKey: 'transaction_type',
        cell: ({ row }: any) => (
          <div className="whitespace-nowrap">
            {row.original.transaction_type === 'Sent' ? (
              <ArrowUp color={chartColors.red} size={16} />
            ) : (
              <ArrowDown color={chartColors.green} size={16} />
            )}
          </div>
        ),
      },
      {
        id: 'Date',
        header: t('chain.transactions.columns.date'),
        accessorKey: 'created_at',
        cell: ({ row }: any) => (
          <div className="whitespace-nowrap">
            {t('chain.transactions.ago', {
              time: getDateDif(row.original.created_at) || '',
            })}
          </div>
        ),
      },
      {
        id: 'Sats',
        header: t('chain.transactions.columns.sats'),
        accessorKey: 'tokens',
        cell: ({ row }: any) => (
          <div className="whitespace-nowrap font-mono">
            <Price amount={row.original.tokens} />
          </div>
        ),
      },
      {
        id: 'Fee',
        header: t('chain.transactions.columns.fee'),
        accessorKey: 'fee',
        cell: ({ row }: any) => (
          <div className="whitespace-nowrap font-mono">
            <Price amount={row.original.fee} />
          </div>
        ),
      },
      {
        id: 'Confirmations',
        header: t('chain.transactions.columns.confirmations'),
        accessorKey: 'confirmation_count',
        cell: ({ row }: any) =>
          row.original.is_confirmed ? (
            row.original.confirmation_count
          ) : (
            <Badge variant="secondary">
              {t('chain.transactions.unconfirmed')}
            </Badge>
          ),
      },
      {
        id: 'Block Height',
        header: t('chain.transactions.columns.blockHeight'),
        accessorKey: 'confirmation_height',
      },
      {
        id: 'Output Addresses',
        header: t('chain.transactions.columns.outputAddresses'),
        accessorKey: 'output_addresses',
        enableSorting: false,
        cell: ({ row }: any) =>
          row.original.output_addresses.map((a: string) => (
            <div key={a} className="whitespace-nowrap">
              {getAddressLink(a)}
            </div>
          )),
      },
      {
        id: 'Transaction',
        header: t('chain.transactions.columns.transaction'),
        accessorKey: 'id',
        enableSorting: false,
        cell: ({ row }: any) => (
          <div className="whitespace-nowrap">
            {getTransactionLink(row.original.id)}
          </div>
        ),
      },
      {
        id: 'Actions',
        header: t('chain.transactions.columns.actions'),
        enableSorting: false,
        cell: ({ row }: any) => {
          const tx: ChainTx = row.original;
          if (tx.is_confirmed) return null;
          if (tx.cpfp_vout == null) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {t('chain.cpfp.noWalletOutputShort')}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  {t('chain.cpfp.noWalletOutput')}
                </TooltipContent>
              </Tooltip>
            );
          }
          return (
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setBumping(tx)}
            >
              <Rocket size={14} />
              {t('chain.cpfp.action')}
            </Button>
          );
        },
      },
    ],
    [chartColors, t]
  );

  if (loading) {
    return <LoadingCard noCard={true} />;
  }

  if (!data?.getChainTransactions?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <ArrowUpDown size={24} className="mb-2 opacity-50" />
        <span className="text-sm">{t('chain.transactions.empty')}</span>
      </div>
    );
  }

  return (
    <>
      <Table columns={columns} data={tableData} withSorting={true} />
      <CpfpDialog transaction={bumping} onClose={() => setBumping(null)} />
    </>
  );
};
