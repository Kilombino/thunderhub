import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  useNotificationDispatch,
  useNotificationState,
} from '../../context/NotificationContext';
import { t } from '@/i18n';

export const NotificationSettings = () => {
  const { channels, forwardAttempts, forwards, invoices, payments, autoClose } =
    useNotificationState();

  const dispatch = useNotificationDispatch();

  const handleToggle = (property: string, value: boolean) =>
    dispatch({ type: 'change', [property]: value });

  const items = [
    {
      label: t('settings.notifications.invoices'),
      property: 'invoices',
      value: invoices,
    },
    {
      label: t('settings.notifications.payments'),
      property: 'payments',
      value: payments,
    },
    {
      label: t('settings.notifications.channels'),
      property: 'channels',
      value: channels,
    },
    {
      label: t('settings.notifications.forwards'),
      property: 'forwards',
      value: forwards,
    },
    {
      label: t('settings.notifications.forwardAttempts'),
      property: 'forwardAttempts',
      value: forwardAttempts,
    },
    {
      label: t('settings.notifications.autoClose'),
      property: 'autoClose',
      value: autoClose,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        {t('settings.notifications.title')}
      </h2>
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
