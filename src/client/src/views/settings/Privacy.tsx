import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useConfigState, useConfigDispatch } from '../../context/ConfigContext';
import { t } from '@/i18n';

export const PrivacySettings = () => {
  const { fetchFees, fetchPrices, displayValues } = useConfigState();
  const dispatch = useConfigDispatch();

  const handleToggle = (type: string, value: boolean) => {
    localStorage.setItem(type, JSON.stringify(value));
    dispatch({ type: 'change', [type]: value });
  };

  const items = [
    {
      label: t('settings.privacy.fetchFees'),
      property: 'fetchFees',
      value: fetchFees,
    },
    {
      label: t('settings.privacy.fetchPrices'),
      property: 'fetchPrices',
      value: fetchPrices,
    },
    {
      label: t('settings.privacy.displayValues'),
      property: 'displayValues',
      value: displayValues,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t('settings.privacy.title')}</h2>
      <Card>
        <CardContent className="space-y-4">
          {items.map(item => (
            <div
              key={item.property}
              className="flex items-center justify-between"
            >
              <span className="text-sm font-medium">{item.label}</span>
              <Switch
                checked={item.value}
                onCheckedChange={checked =>
                  handleToggle(item.property, checked)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
