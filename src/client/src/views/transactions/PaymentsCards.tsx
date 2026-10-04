import { useMemo } from 'react';
import { PaymentType } from '../../graphql/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  getDateDif,
  getFormatDate,
  getNodeLink,
} from '../../components/generic/helpers';
import { Price } from '../../components/price/Price';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { decode } from 'light-bolt11-decoder';
import { ComputedMarker } from './ComputedMarker';
import { DetailTable, DetailRow } from './DetailTable';
import {
  getTradeMemoDisplay,
  getTradeMemoText,
  TradeDisplayMode,
} from './tradeMemo';

interface PaymentsCardProps {
  payment: PaymentType;
  tradeDisplayMode: TradeDisplayMode;
  index: number;
  setIndexOpen: (index: number) => void;
  indexOpen: number;
}

const StatusBadge = ({ confirmed }: { confirmed: boolean }) => {
  if (confirmed) {
    return (
      <Badge
        variant="secondary"
        className="w-17.5 justify-center text-[10px] rounded-sm bg-green-500/10 text-green-600 dark:text-green-400"
      >
        Confirmed
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="w-17.5 justify-center text-[10px] rounded-sm"
    >
      Pending
    </Badge>
  );
};

const decodeRequest = (
  request: string | null | undefined,
  tradeDisplayMode: TradeDisplayMode
) => {
  if (!request) return null;
  try {
    const decoded = decode(request);
    const descSection = decoded.sections.find(s => s.name === 'description');
    if (descSection && 'value' in descSection && descSection.value) {
      return getTradeMemoText(descSection.value as string, tradeDisplayMode);
    }
    return null;
  } catch {
    return null;
  }
};

export const PaymentsCard = ({
  payment,
  tradeDisplayMode,
  index,
  setIndexOpen,
  indexOpen,
}: PaymentsCardProps) => {
  const {
    created_at,
    destination,
    destination_node,
    fee,
    fee_mtokens,
    hops,
    id,
    is_confirmed,
    is_outgoing,
    mtokens,
    request,
    secret,
    tokens,
    date,
    is_bolt12,
  } = payment;

  const alias = destination_node?.node?.alias;
  const isOpen = index === indexOpen;

  const description = useMemo(
    () => decodeRequest(request, tradeDisplayMode),
    [request, tradeDisplayMode]
  );
  const descriptionDisplay = useMemo(() => {
    if (!request) return null;

    try {
      const decoded = decode(request);
      const descSection = decoded.sections.find(s => s.name === 'description');

      if (descSection && 'value' in descSection && descSection.value) {
        return getTradeMemoDisplay(descSection.value as string);
      }

      return null;
    } catch {
      return null;
    }
  }, [request]);

  const handleClick = () => {
    setIndexOpen(isOpen ? 0 : index);
  };

  // BOLT 12 payments keep no request in LND and end at a blinded node id,
  // so there is no description or alias to show.
  const title = description || alias || (is_bolt12 ? 'BOLT 12' : 'Unknown');

  const bolt12Badge = is_bolt12 ? (
    <Badge
      variant="secondary"
      className="justify-center text-[10px] rounded-sm shrink-0"
    >
      BOLT 12
    </Badge>
  ) : null;

  return (
    <div className="rounded border border-border bg-card/50 hover:bg-card transition-colors">
      <button
        onClick={handleClick}
        className="w-full text-left px-3 py-2.5 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <StatusBadge confirmed={is_confirmed} />
          </div>
          <div className="hidden sm:flex flex-1 min-w-0 items-center gap-2">
            <span className="font-medium text-sm truncate">{title}</span>
            {description || alias ? bolt12Badge : null}
            {tradeDisplayMode === 'computed' &&
              descriptionDisplay?.isTradeMemo && <ComputedMarker />}
          </div>
          <span className="hidden sm:block text-xs text-muted-foreground shrink-0">
            {getDateDif(date)} ago
          </span>
          <span className="font-mono text-sm font-medium text-destructive shrink-0 ml-auto sm:ml-0">
            -<Price amount={tokens} />
          </span>
          {isOpen ? (
            <ChevronUp size={14} className="text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground shrink-0" />
          )}
        </div>
        <div className="flex sm:hidden items-center gap-2 mt-1.5">
          <span className="text-xs truncate text-muted-foreground">
            {title}
          </span>
          {description || alias ? bolt12Badge : null}
          {tradeDisplayMode === 'computed' &&
            descriptionDisplay?.isTradeMemo && <ComputedMarker />}
          <span className="text-[11px] text-muted-foreground shrink-0 ml-auto">
            {getDateDif(date)} ago
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="px-3 pb-3">
          <Separator className="mb-3" />
          <DetailTable>
            {descriptionDisplay?.isTradeMemo && (
              <DetailRow label="Parsed Description">
                <div className="inline-flex items-start gap-1">
                  <span>{descriptionDisplay.computed}</span>
                  <ComputedMarker />
                </div>
              </DetailRow>
            )}
            {description && (
              <DetailRow label="Description">
                {descriptionDisplay?.raw ?? description}
              </DetailRow>
            )}
            <DetailRow label="Created">
              {`${getDateDif(created_at)} ago (${getFormatDate(created_at)})`}
            </DetailRow>
            <DetailRow label="Destination">
              {getNodeLink(destination, alias)}
            </DetailRow>
            <DetailRow label="Fee">
              <Price amount={fee} />
            </DetailRow>
            <DetailRow label="Fee (msats)">
              {`${fee_mtokens} millisats`}
            </DetailRow>
            <DetailRow label="Hops">{hops.length}</DetailRow>
            {hops.map((hop, idx) => (
              <DetailRow key={idx} label={`Hop ${idx + 1}`}>
                {getNodeLink(hop.node?.public_key, hop.node?.alias)}
              </DetailRow>
            ))}
            <DetailRow label="ID">{id}</DetailRow>
            <DetailRow label="Outgoing">{is_outgoing ? 'Yes' : 'No'}</DetailRow>
            {secret && <DetailRow label="Secret">{secret}</DetailRow>}
            <DetailRow label="Amount (msats)">
              {`${mtokens} millisats`}
            </DetailRow>
            {request && <DetailRow label="Request">{request}</DetailRow>}
            {is_bolt12 && <DetailRow label="Type">BOLT 12 offer</DetailRow>}
          </DetailTable>
        </div>
      )}
    </div>
  );
};
