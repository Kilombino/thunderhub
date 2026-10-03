import { GridWrapper } from '../components/gridWrapper/GridWrapper';
import { ChainTransactions } from '../views/chain/transactions/ChainTransactions';
import { ChainUtxos } from '../views/chain/utxos/ChainUtxos';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTranslation } from '@/i18n';

const ChainView = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('utxos');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{t('chain.title')}</h2>

        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={activeTab}
            onValueChange={v => v && setActiveTab(v)}
          >
            <ToggleGroupItem value="utxos">
              {t('chain.tabs.utxos')}
            </ToggleGroupItem>
            <ToggleGroupItem value="transactions">
              {t('chain.tabs.transactions')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <Card>
        <CardContent>
          {activeTab === 'utxos' && <ChainUtxos />}
          {activeTab === 'transactions' && <ChainTransactions />}
        </CardContent>
      </Card>
    </div>
  );
};

const ChainPage = () => (
  <GridWrapper centerContent={false}>
    <ChainView />
  </GridWrapper>
);

export default ChainPage;
