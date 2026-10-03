import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, Loader2, X, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Pay } from '../../home/account/pay/Pay';
import {
  useGetMagmaOrdersQuery,
  GetMagmaOrdersQuery,
} from '../../../graphql/queries/__generated__/getMagmaOrders.generated';
import { useGetMagmaOrderInvoiceLazyQuery } from '../../../graphql/queries/__generated__/getMagmaOrderInvoice.generated';
import { useCancelMagmaOrderMutation } from '../../../graphql/mutations/__generated__/cancelMagmaOrder.generated';
import { OrderCancellationReason } from '../../../graphql/types';
import { getErrorContent } from '../../../utils/error';
import { t } from '@/i18n';
import { Price } from '../../../components/price/Price';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

export type MagmaTab = 'purchases' | 'sales';

type MagmaOrder = NonNullable<
  NonNullable<GetMagmaOrdersQuery['getMagmaOrders']>['purchases'][number]
>;

export const STATUS_LABELS: Record<string, string> = {
  WAITING_FOR_SELLER_APPROVAL: t(
    'channels.magma.status.waitingForSellerApproval'
  ),
  WAITING_FOR_BUYER_PAYMENT: t('channels.magma.status.waitingForBuyerPayment'),
  WAITING_FOR_CHANNEL_OPEN: t('channels.magma.status.waitingForChannelOpen'),
  SELLER_SENT_TRANSACTION: t('channels.magma.status.sellerSentTransaction'),
  WAITING_FOR_ON_CHAIN_CONFIRMATION: t(
    'channels.magma.status.waitingForOnChainConfirmation'
  ),
  VALID_CHANNEL_OPENING: t('channels.magma.status.validChannelOpening'),
  SELLER_OPENED_CHANNEL: t('channels.magma.status.sellerOpenedChannel'),
  CHANNEL_MONITORING_FINISHED: t(
    'channels.magma.status.channelMonitoringFinished'
  ),
  SELLER_REJECTED: t('channels.magma.status.sellerRejected'),
  BUYER_REJECTED: t('channels.magma.status.buyerRejected'),
  SELLER_FAILED_TO_REACT: t('channels.magma.status.sellerFailedToReact'),
  BUYER_FAILED_TO_PAY: t('channels.magma.status.buyerFailedToPay'),
  SELLER_FAILED_TO_OPEN_CHANNEL: t(
    'channels.magma.status.sellerFailedToOpenChannel'
  ),
  INVALID_CHANNEL_OPENING: t('channels.magma.status.invalidChannelOpening'),
  ADMIN_CLOSED: t('channels.magma.status.adminClosed'),
};

type StatusColor = 'blue' | 'yellow' | 'green' | 'red' | 'gray';

const STATUS_COLORS: Record<string, StatusColor> = {
  WAITING_FOR_SELLER_APPROVAL: 'yellow',
  WAITING_FOR_BUYER_PAYMENT: 'blue',
  WAITING_FOR_CHANNEL_OPEN: 'yellow',
  SELLER_SENT_TRANSACTION: 'yellow',
  WAITING_FOR_ON_CHAIN_CONFIRMATION: 'yellow',
  VALID_CHANNEL_OPENING: 'green',
  SELLER_OPENED_CHANNEL: 'green',
  CHANNEL_MONITORING_FINISHED: 'green',
  SELLER_REJECTED: 'red',
  BUYER_REJECTED: 'red',
  SELLER_FAILED_TO_REACT: 'red',
  BUYER_FAILED_TO_PAY: 'red',
  SELLER_FAILED_TO_OPEN_CHANNEL: 'red',
  INVALID_CHANNEL_OPENING: 'red',
  ADMIN_CLOSED: 'gray',
};

const COLOR_CLASSES: Record<StatusColor, string> = {
  blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  yellow: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  green: 'bg-green-500/10 text-green-700 dark:text-green-400',
  red: 'bg-red-500/10 text-red-700 dark:text-red-400',
  gray: 'bg-muted text-muted-foreground',
};

const CANCELLATION_REASON_LABELS: Record<OrderCancellationReason, string> = {
  [OrderCancellationReason.UnableToConnectToNode]: t(
    'channels.magma.reasons.unableToConnect'
  ),
  [OrderCancellationReason.UnableToPay]: t(
    'channels.magma.reasons.unableToPay'
  ),
  [OrderCancellationReason.ChannelSizeOutOfBounds]: t(
    'channels.magma.reasons.sizeOutOfBounds'
  ),
};

const BUYER_CANCELLABLE = new Set([
  'WAITING_FOR_SELLER_APPROVAL',
  'WAITING_FOR_BUYER_PAYMENT',
]);
const SELLER_CANCELLABLE = new Set(['WAITING_FOR_CHANNEL_OPEN']);

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function statusColor(status: string): StatusColor {
  return STATUS_COLORS[status] ?? 'gray';
}

function peerName(
  party: { pubkey?: string | null; alias?: string | null } | null | undefined
): string {
  if (!party) return t('channels.unknown');
  return (
    party.alias ||
    (party.pubkey ? party.pubkey.slice(0, 16) + '…' : t('channels.unknown'))
  );
}

function OrderTable({
  orders,
  role,
  magmaUrl,
  onCancelRequest,
  onPayRequest,
}: {
  orders: MagmaOrder[];
  role: 'buyer' | 'seller';
  magmaUrl: string;
  onCancelRequest: (id: string) => void;
  onPayRequest: (orderId: string) => void;
}) {
  if (!orders.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        {role === 'buyer'
          ? t('channels.magma.noPurchases')
          : t('channels.magma.noSales')}
      </p>
    );
  }

  const cancellable = role === 'buyer' ? BUYER_CANCELLABLE : SELLER_CANCELLABLE;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('channels.columns.peer')}</TableHead>
          <TableHead>{t('common.amount')}</TableHead>
          <TableHead>{t('common.fee')}</TableHead>
          <TableHead>{t('channels.columns.status')}</TableHead>
          <TableHead>{t('channels.magma.created')}</TableHead>
          <TableHead className="text-right">
            {t('channels.magma.action')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map(order => {
          const peer =
            role === 'buyer'
              ? peerName(order.source)
              : peerName(order.destination);
          const feeSats =
            role === 'buyer'
              ? order.fees?.buyer?.sats
              : order.fees?.seller?.sats;
          const created = order.createdAt
            ? new Date(order.createdAt).toLocaleDateString()
            : '-';
          const canCancel = cancellable.has(order.status);

          return (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{peer}</TableCell>
              <TableCell>
                <Price amount={order.amount?.sats} />
              </TableCell>
              <TableCell>
                {feeSats != null ? <Price amount={feeSats} /> : '-'}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_CLASSES[statusColor(order.status)]}`}
                >
                  {statusLabel(order.status)}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">{created}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {canCancel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer text-destructive hover:text-destructive"
                      onClick={() => onCancelRequest(order.id)}
                    >
                      <X className="mr-1 size-3.5" />
                      {t('common.cancel')}
                    </Button>
                  )}
                  {order.status === 'WAITING_FOR_BUYER_PAYMENT' &&
                    role === 'buyer' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPayRequest(order.id)}
                      >
                        <Zap className="mr-1 size-3.5" />
                        {t('channels.magma.pay')}
                      </Button>
                    )}
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={`${magmaUrl}/order/${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-1 size-3.5" />
                      {t('channels.magma.viewOnAmboss')}
                    </a>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export const useMagmaOrders = () => {
  const { data, refetch } = useGetMagmaOrdersQuery();

  const orders = data?.magma?.orders?.find_many;
  const purchases = orders?.purchases ?? [];
  const sales = orders?.sales ?? [];
  const magmaUrl = orders?.magmaUrl ?? '';

  return { purchases, sales, magmaUrl, refetch };
};

export const MagmaOrders = ({
  tab,
  statusFilter,
}: {
  tab: MagmaTab;
  statusFilter: string;
}) => {
  const { purchases, sales, magmaUrl, refetch } = useMagmaOrders();
  const [cancelOrder, { loading: cancelling }] = useCancelMagmaOrderMutation({
    onError: err => toast.error(getErrorContent(err)),
  });
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] =
    useState<OrderCancellationReason | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [
    fetchInvoice,
    { data: invoiceData, loading: invoiceLoading, reset: resetInvoice },
  ] = useGetMagmaOrderInvoiceLazyQuery();

  const payingInvoice =
    invoiceData?.magma?.orders?.get_invoice?.invoice ?? null;

  const allOrders = tab === 'purchases' ? purchases : sales;

  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? allOrders
        : allOrders.filter(o => o.status === statusFilter),
    [allOrders, statusFilter]
  );

  const handleCancelRequest = (id: string) => {
    setConfirmingId(id);
    setCancelReason(null);
  };

  const handleConfirm = async () => {
    if (!confirmingId || !cancelReason) return;
    const { data } = await cancelOrder({
      variables: {
        input: { orderId: confirmingId, cancellationReason: cancelReason },
      },
    });
    if (data?.magma.cancel_order.success) {
      setConfirmingId(null);
      setCancelReason(null);
      refetch();
    }
  };

  const handleDismiss = () => {
    setConfirmingId(null);
    setCancelReason(null);
  };

  return (
    <>
      <OrderTable
        orders={filtered}
        role={tab === 'purchases' ? 'buyer' : 'seller'}
        magmaUrl={magmaUrl}
        onCancelRequest={handleCancelRequest}
        onPayRequest={orderId => {
          setPayDialogOpen(true);
          fetchInvoice({ variables: { orderId } });
        }}
      />

      <Dialog
        open={!!confirmingId}
        onOpenChange={open => !open && handleDismiss()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('channels.magma.cancelOrder')}</DialogTitle>
            <DialogDescription>
              {t('channels.magma.cancelReasonDescription')}
            </DialogDescription>
          </DialogHeader>
          <Select
            value={cancelReason ?? undefined}
            onValueChange={v => setCancelReason(v as OrderCancellationReason)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('channels.magma.selectReason')} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CANCELLATION_REASON_LABELS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              disabled={cancelling}
            >
              {t('common.back')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={cancelling || !cancelReason}
            >
              {t('channels.magma.cancelOrder')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={payDialogOpen}
        onOpenChange={open => {
          if (!open) {
            setPayDialogOpen(false);
            resetInvoice();
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('channels.magma.payInvoice')}</DialogTitle>
            <DialogDescription>
              {t('channels.magma.payInvoiceDescription')}
            </DialogDescription>
          </DialogHeader>

          {invoiceLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin size-6 text-muted-foreground" />
            </div>
          )}

          {!invoiceLoading && !payingInvoice && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('channels.magma.noInvoice')}
            </p>
          )}

          {!invoiceLoading && payingInvoice && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <div className="rounded border border-border bg-white p-3">
                  <QRCodeSVG value={`lightning:${payingInvoice}`} size={200} />
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="max-w-full break-all text-center font-mono text-[11px] text-muted-foreground">
                  {payingInvoice}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigator.clipboard
                      .writeText(payingInvoice)
                      .then(() => toast.success(t('channels.magma.copied')))
                      .catch(() => toast.error(t('channels.magma.copyFailed')))
                  }
                >
                  <Copy size={14} className="mr-1" />
                  {t('channels.magma.copyInvoice')}
                </Button>
              </div>

              <Pay
                predefinedRequest={payingInvoice}
                payCallback={() => {
                  setPayDialogOpen(false);
                  resetInvoice();
                  refetch();
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
