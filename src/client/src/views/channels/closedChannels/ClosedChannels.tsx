import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { useGetClosedChannelsQuery } from '../../../graphql/queries/__generated__/getClosedChannels.generated';
import { getErrorContent } from '../../../utils/error';
import { t } from '@/i18n';
import { LoadingCard } from '../../../components/loading/LoadingCard';
import Table from '../../../components/table';
import { Price } from '../../../components/price/Price';
import { blockToTime } from '../../../utils/helpers';
import { orderBy } from 'lodash';
import {
  getNodeLink,
  getTransactionLink,
} from '../../../components/generic/helpers';

export const ClosedChannels = () => {
  const { loading, data } = useGetClosedChannelsQuery({
    onError: error => toast.error(getErrorContent(error)),
  });

  const tableData = useMemo(() => {
    const channelData = data?.getClosedChannels || [];
    const sorted = orderBy(channelData, ['closed_for_blocks'], ['asc']);

    return sorted.map(c => {
      const getCloseType = (): string => {
        const types: string[] = [];

        if (c.is_breach_close) types.push(t('channels.closed.types.breach'));
        if (c.is_cooperative_close)
          types.push(t('channels.closed.types.cooperative'));
        if (c.is_funding_cancel)
          types.push(t('channels.closed.types.fundingCancel'));
        if (c.is_local_force_close)
          types.push(t('channels.closed.types.localForceClose'));
        if (c.is_remote_force_close)
          types.push(t('channels.closed.types.remoteForceClose'));

        return types.join(', ');
      };

      return {
        ...c,
        alias: c.partner_node_info.node?.alias || t('channels.unknown'),
        closeType: getCloseType(),
      };
    });
  }, [data]);

  const columns = useMemo(
    () => [
      {
        header: t('channels.columns.peer'),
        accessorKey: 'alias',
        enableSorting: true,
        cell: ({ row }: any) => (
          <div className="whitespace-nowrap">
            {getNodeLink(row.original.partner_public_key, row.original.alias)}
          </div>
        ),
      },
      {
        header: t('channels.columns.closedSince'),
        accessorKey: 'closed_for_blocks',
        enableSorting: true,
        cell: ({ row }: any) => (
          <div className="whitespace-nowrap">
            {blockToTime(row.original.closed_for_blocks)}
          </div>
        ),
      },
      {
        header: t('channels.columns.channelAge'),
        accessorKey: 'channel_age',
        enableSorting: true,
        cell: ({ row }: any) => (
          <div className="whitespace-nowrap">
            {blockToTime(row.original.channel_age)}
          </div>
        ),
      },
      {
        header: t('channels.columns.capacity'),
        accessorKey: 'capacity',
        enableSorting: true,
        cell: ({ row }: any) => (
          <div className="whitespace-nowrap">
            <Price amount={row.original.capacity} />
          </div>
        ),
      },
      {
        header: t('channels.columns.closeType'),
        accessorKey: 'closeType',
      },
      {
        header: t('channels.columns.transactionId'),
        accessorKey: 'transaction_id',
        enableSorting: true,
        cell: ({ row }: any) => getTransactionLink(row.original.transaction_id),
      },
    ],
    []
  );

  if (loading) {
    return <LoadingCard noCard={true} />;
  }

  if (!data || !data.getClosedChannels) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        {t('channels.closed.empty')}
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      data={tableData}
      withGlobalSort={true}
      withSorting={true}
      filterPlaceholder={t('channels.table.filterPlaceholder')}
    />
  );
};
