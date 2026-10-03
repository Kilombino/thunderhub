import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { useGetTwofaSecretQuery } from '../../graphql/queries/__generated__/getTwofaSecret.generated';
import { useAccount } from '../../hooks/UseAccount';
import { QRCodeSVG } from 'qrcode.react';
import { LoadingCard } from '../../components/loading/LoadingCard';
import { useRemoveTwofaSecretMutation } from '../../graphql/mutations/__generated__/removeTwofaSecret.generated';
import toast from 'react-hot-toast';
import { useUpdateTwofaSecretMutation } from '../../graphql/mutations/__generated__/updateTwofaSecret.generated';
import { config } from '../../config/thunderhubConfig';
import { t } from '@/i18n';

const Enable: FC<{ callback: () => void }> = ({ callback }) => {
  const [token, setToken] = useState<string>('');
  const { data, loading, error } = useGetTwofaSecretQuery();

  const [update, { loading: updateLoading }] = useUpdateTwofaSecretMutation({
    onCompleted: () => {
      callback();
      toast.success(t('settings.security.enabledToast'));
    },
    refetchQueries: ['GetAccount'],
    onError: ({ graphQLErrors }) => {
      const messages = graphQLErrors.map(e => (
        <div key={e.message}>{e.message}</div>
      ));
      toast.error(<div>{messages}</div>);
    },
  });

  if (loading) {
    return <LoadingCard noCard={true} />;
  }

  if (error?.message) {
    return (
      <div className="w-full flex flex-col justify-center items-center text-sm text-muted-foreground">
        {error.message}
      </div>
    );
  }

  if (!data?.getTwofaSecret.url) {
    return (
      <div className="w-full flex flex-col justify-center items-center text-sm text-muted-foreground">
        {t('settings.security.secretError')}
      </div>
    );
  }

  const handleClick = () => {
    update({ variables: { token, secret: data.getTwofaSecret.secret } });
  };

  return (
    <div className="space-y-4 pt-2">
      <Separator />
      <div className="flex flex-col items-center gap-3">
        <div className="w-62 h-62 bg-white p-3 rounded-lg">
          <QRCodeSVG value={data.getTwofaSecret.url} size={224} />
        </div>
        <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {data.getTwofaSecret.secret}
        </code>
      </div>
      <Separator />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="number"
          placeholder={t('settings.security.tokenPlaceholder')}
          value={token}
          onChange={e => setToken(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleClick()}
          className="sm:max-w-70"
        />
        <Button
          className="w-full sm:w-auto"
          disabled={!token || updateLoading}
          onClick={handleClick}
        >
          {updateLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              <ShieldCheck size={16} />
              {t('settings.security.enable2fa')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

const Disable: FC<{ callback: () => void }> = ({ callback }) => {
  const [token, setToken] = useState<string>('');
  const [remove, { loading }] = useRemoveTwofaSecretMutation({
    onCompleted: () => {
      callback();
      toast.success(t('settings.security.disabledToast'));
    },
    refetchQueries: ['GetAccount'],
    onError: ({ graphQLErrors }) => {
      const messages = graphQLErrors.map(e => (
        <div key={e.message}>{e.message}</div>
      ));
      toast.error(<div>{messages}</div>);
    },
  });

  const handleClick = () => {
    remove({ variables: { token } });
  };

  return (
    <div className="space-y-4 pt-2">
      <Separator />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="number"
          placeholder={t('settings.security.tokenPlaceholder')}
          value={token}
          onChange={e => setToken(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleClick()}
          className="sm:max-w-70"
        />
        <Button
          variant="destructive"
          className="w-full sm:w-auto"
          disabled={!token || loading}
          onClick={handleClick}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              <ShieldOff size={16} />
              {t('settings.security.disable2fa')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export const Security = () => {
  const user = useAccount();
  const [enable, setEnabled] = useState<boolean>(false);

  if (!user || config.disable2FA) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t('settings.security.title')}</h2>
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {user.twofaEnabled
                ? t('settings.security.disable2fa')
                : t('settings.security.enable2fa')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEnabled(p => !p)}
            >
              {enable ? (
                t('common.cancel')
              ) : (
                <>
                  {user.twofaEnabled
                    ? t('settings.security.disable')
                    : t('settings.security.enable')}{' '}
                  <ChevronRight size={16} />
                </>
              )}
            </Button>
          </div>
          {enable &&
            (user.twofaEnabled ? (
              <Disable callback={() => setEnabled(false)} />
            ) : (
              <Enable callback={() => setEnabled(false)} />
            ))}
        </CardContent>
      </Card>
    </div>
  );
};
