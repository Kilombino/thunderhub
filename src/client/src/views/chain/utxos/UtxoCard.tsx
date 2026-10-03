import { Utxo } from '../../../graphql/types';
import { Separator } from '@/components/ui/separator';
import { MainInfo } from '../../../components/generic/CardGeneric';
import {
  getTransactionLink,
  renderLine,
} from '../../../components/generic/helpers';
import { getPrice } from '../../../components/price/Price';
import { useConfigState } from '../../../context/ConfigContext';
import { usePriceState } from '../../../context/PriceContext';
import { t } from '@/i18n';

interface TransactionsCardProps {
  utxo: Utxo;
  index: number;
  setIndexOpen: (index: number) => void;
  indexOpen: number;
}

export const UtxoCard = ({
  utxo,
  index,
  setIndexOpen,
  indexOpen,
}: TransactionsCardProps) => {
  const { currency, displayValues } = useConfigState();
  const priceContext = usePriceState();
  const format = getPrice(currency, displayValues, priceContext);

  const {
    address,
    address_format,
    confirmation_count,
    output_script,
    tokens,
    transaction_id,
    transaction_vout,
  } = utxo;

  const formatAmount = format({ amount: tokens });

  const handleClick = () => {
    if (indexOpen === index) {
      setIndexOpen(0);
    } else {
      setIndexOpen(index);
    }
  };

  const renderDetails = () => {
    return (
      <>
        <Separator className="my-3" />
        {renderLine(t('chain.utxos.card.addressFormat'), address_format)}
        {renderLine(t('chain.utxos.card.confirmations'), confirmation_count)}
        {renderLine(t('chain.utxos.card.outputScript'), output_script)}
        {renderLine(
          t('chain.utxos.card.transactionId'),
          getTransactionLink(transaction_id)
        )}
        {renderLine(
          t('chain.utxos.card.transactionVout'),
          transaction_vout >= 0 ? `${transaction_vout}` : '-'
        )}
      </>
    );
  };

  return (
    <div
      key={index}
      className="rounded-md border border-border bg-card p-4 hover:shadow-sm transition-shadow"
    >
      <MainInfo onClick={() => handleClick()}>
        {renderLine(t('chain.utxos.card.address'), address)}
        {renderLine(t('chain.utxos.card.amount'), formatAmount)}
      </MainInfo>
      {index === indexOpen && renderDetails()}
    </div>
  );
};
