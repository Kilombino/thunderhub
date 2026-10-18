import { FC } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Bolt12Receipt as Bolt12ReceiptFieldsFragment } from '@/graphql/types';
import { getLocale, t } from '@/i18n';

const MSAT_PER_SAT = 1000;

const sats = (msat: string) =>
  (Number(msat) / MSAT_PER_SAT).toLocaleString(getLocale(), {
    maximumFractionDigits: 3,
  });

/** The receipt as plain text: what each part proves, and how to check it. */
export const receiptText = (r: Bolt12ReceiptFieldsFragment): string =>
  [
    t('wallet.bolt12Receipt.title'),
    '',
    `${t('wallet.bolt12Receipt.paidAt')}: ${r.paid_at}`,
    `${t('wallet.bolt12Receipt.amount')}: ${sats(r.amount_msat)} sats (${r.amount_msat} msat)`,
    `${t('wallet.bolt12Receipt.fee')}: ${sats(r.fee_msat)} sats`,
    r.description
      ? `${t('wallet.bolt12Receipt.description')}: ${r.description}`
      : null,
    r.issuer ? `${t('wallet.bolt12Receipt.issuer')}: ${r.issuer}` : null,
    r.payer_note
      ? `${t('wallet.bolt12Receipt.payerNote')}: ${r.payer_note}`
      : null,
    '',
    `${t('wallet.bolt12Receipt.offer')}:`,
    r.offer,
    r.offer_id ? `offer_id: ${r.offer_id}` : null,
    '',
    `${t('wallet.bolt12Receipt.invoice')}:`,
    r.invoice,
    `${t('wallet.bolt12Receipt.signedBy')}: ${r.invoice_node_id || '?'}`,
    `${t('wallet.bolt12Receipt.signature')}: ${r.invoice_signature_valid ? 'OK' : 'INVALID'}`,
    r.payer_id ? `payer_id: ${r.payer_id}` : null,
    '',
    `payment_hash: ${r.payment_hash}`,
    `payment_preimage: ${r.payment_preimage}`,
    `SHA-256(preimage) = payment_hash: ${r.preimage_matches ? 'OK' : 'NO'}`,
    '',
    t('wallet.bolt12Receipt.howToCheck'),
  ]
    .filter(l => l !== null)
    .join('\n');

const download = (name: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

const copy = (text: string) => {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(t('wallet.bolt12Receipt.copied')));
  }
};

const Check: FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <div
    className={`flex items-center gap-2 ${ok ? 'text-green-500' : 'text-destructive'}`}
  >
    {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
    <span>{label}</span>
  </div>
);

const Row: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 px-3 py-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono break-all">{value}</span>
  </div>
);

/**
 * Proof of a BOLT 12 payment: the invoice the payee signed for the offer,
 * with its signature checked by the node, and the preimage that only the
 * payee could release, which hashes to that invoice's payment hash.
 */
export const Bolt12ReceiptView: FC<{
  receipt: Bolt12ReceiptFieldsFragment;
}> = ({ receipt: r }) => {
  const base = `bolt12-receipt-${r.payment_hash.slice(0, 16)}`;
  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="font-medium text-sm">
        {t('wallet.bolt12Receipt.title')}
      </div>
      <div className="flex flex-col gap-1">
        <Check
          ok={r.invoice_signature_valid}
          label={t('wallet.bolt12Receipt.signatureOk')}
        />
        <Check
          ok={r.preimage_matches}
          label={t('wallet.bolt12Receipt.preimageOk')}
        />
        {!r.saved && (
          <div className="text-destructive">
            {t('wallet.bolt12Receipt.notSaved')}
          </div>
        )}
      </div>
      <div className="divide-y divide-border rounded border border-border">
        <Row
          label={t('wallet.bolt12Receipt.paidAt')}
          value={new Date(r.paid_at).toLocaleString(getLocale())}
        />
        <Row
          label={t('wallet.bolt12Receipt.amount')}
          value={`${sats(r.amount_msat)} sats · ${t('wallet.bolt12Receipt.fee')} ${sats(r.fee_msat)} sats`}
        />
        {r.description && (
          <Row
            label={t('wallet.bolt12Receipt.description')}
            value={r.description}
          />
        )}
        {r.issuer && (
          <Row label={t('wallet.bolt12Receipt.issuer')} value={r.issuer} />
        )}
        {r.payer_note && (
          <Row
            label={t('wallet.bolt12Receipt.payerNote')}
            value={r.payer_note}
          />
        )}
        <Row
          label={t('wallet.bolt12Receipt.signedBy')}
          value={r.invoice_node_id || '?'}
        />
        <Row label="payment_hash" value={r.payment_hash} />
        <Row label="payment_preimage" value={r.payment_preimage} />
        <Row label={t('wallet.bolt12Receipt.invoice')} value={r.invoice} />
        <Row label={t('wallet.bolt12Receipt.offer')} value={r.offer} />
      </div>
      <div className="text-muted-foreground">
        {t('wallet.bolt12Receipt.howToCheck')}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy(receiptText(r))}
        >
          <Copy size={14} className="mr-1" /> {t('wallet.bolt12Receipt.copy')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => download(`${base}.txt`, receiptText(r), 'text/plain')}
        >
          <Download size={14} className="mr-1" /> .txt
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const data = { ...r } as Record<string, unknown>;
            delete data.__typename;
            download(
              `${base}.json`,
              JSON.stringify(data, null, 2),
              'application/json'
            );
          }}
        >
          <Download size={14} className="mr-1" /> .json
        </Button>
      </div>
    </div>
  );
};
