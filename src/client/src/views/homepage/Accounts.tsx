import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Lock,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  UserCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  GetServerAccountsQuery,
  useGetServerAccountsQuery,
} from '../../graphql/queries/__generated__/getServerAccounts.generated';
import { useLogoutMutation } from '../../graphql/mutations/__generated__/logout.generated';
import { useGetNodeInfoLazyQuery } from '../../graphql/queries/__generated__/getNodeInfo.generated';
import {
  GetSessionInfoQuery,
  useGetSessionInfoQuery,
} from '../../graphql/queries/__generated__/getSessionInfo.generated';
import { Button } from '@/components/ui/button';
import { Login } from './Login';
import { DbLogin } from './DbLogin';
import { t } from '@/i18n';

type ServerAccount = GetServerAccountsQuery['public']['get_server_accounts'][0];
type SessionInfo = GetSessionInfoQuery['public']['get_session_info'];

const RenderIntro = () => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <div className="mx-auto w-full max-w-md px-4">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            {t('login.intro.welcome')}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('login.intro.getStarted')}
          </p>
        </div>

        <a
          href="https://docs.thunderhub.io/setup/#server-accounts"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-sm text-primary hover:underline"
        >
          {t('login.intro.viewInstructions')}
          <ExternalLink size={12} />
        </a>

        <div className="mt-4 border-t border-border pt-4">
          <button
            className="flex w-full cursor-pointer items-center justify-between bg-transparent p-0 text-xs text-muted-foreground"
            onClick={() => setDetailsOpen(p => !p)}
          >
            {t('login.intro.alreadyCreated')}
            {detailsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {detailsOpen && (
            <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground">
              <p>{t('login.intro.missingInfo')}</p>
              <p>{t('login.intro.serverLogs')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ContinueCard = ({
  session,
  onContinue,
  onSwitch,
  loading,
}: {
  session: SessionInfo;
  onContinue: () => void;
  onSwitch: () => void;
  loading: boolean;
}) => {
  const label =
    session.name ??
    (session.type === 'db'
      ? t('login.accountLogin')
      : session.type === 'sso'
        ? t('login.ssoAccount')
        : t('login.continue.yourAccount'));

  return (
    <div className="mx-auto w-full max-w-md px-4">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserCircle2 size={28} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {t('login.continue.alreadySignedIn')}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('login.continue.continueAs')}{' '}
            <span className="font-medium text-foreground">{label}</span>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button disabled={loading} onClick={onContinue} className="w-full">
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              t('login.continue.continue')
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onSwitch}
            disabled={loading}
            className="w-full"
          >
            {t('login.continue.switchAccount')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Accounts = () => {
  const navigate = useNavigate();
  const [newAccount, setNewAccount] = useState<ServerAccount | null>(null);
  const [connectingSlug, setConnectingSlug] = useState<string | null>(null);
  const [switchMode, setSwitchMode] = useState(false);

  const [logout] = useLogoutMutation({ refetchQueries: ['GetServerAccounts'] });

  const { data: accountData, loading: loadingData } =
    useGetServerAccountsQuery();

  const { data: sessionData, loading: loadingSession } =
    useGetSessionInfoQuery();

  const [getCanConnect, { data, loading }] = useGetNodeInfoLazyQuery({
    fetchPolicy: 'network-only',
    onError: () => {
      toast.error(t('login.unableToConnect'));
      logout();
    },
  });

  useEffect(() => {
    if (!loading && data && data.getNodeInfo && connectingSlug) {
      navigate(`/${connectingSlug}/home`);
    }
  }, [data, loading, navigate, connectingSlug]);

  if (loadingData || loadingSession) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-white/60" size={24} />
      </div>
    );
  }

  const allAccounts = accountData?.public?.get_server_accounts ?? [];
  const hasDbAccount = allAccounts.some(a => a?.type === 'db');
  const yamlAccounts = allAccounts.filter(a => a && a.type !== 'db');
  const session = sessionData?.public?.get_session_info;

  if (!allAccounts.length) {
    return <RenderIntro />;
  }

  const handleClick = (account: ServerAccount) => () => {
    if (account.type === 'sso') {
      setConnectingSlug(account.slug);
      getCanConnect();
    } else {
      setNewAccount(account);
    }
  };

  if (session?.loggedIn && !switchMode) {
    const handleContinue = () => {
      if (
        (session.type === 'server' || session.type === 'sso') &&
        session.slug
      ) {
        // Verify LND connection before navigating; reuse yaml connect flow.
        setConnectingSlug(session.slug);
        getCanConnect();
        return;
      }
      // For db or unknown: let RootRedirect resolve the target route.
      navigate('/');
    };

    return (
      <ContinueCard
        session={session}
        onContinue={handleContinue}
        onSwitch={() => setSwitchMode(true)}
        loading={loading}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {hasDbAccount && !newAccount && <DbLogin />}

      {newAccount && (
        <Login
          account={newAccount}
          onBack={hasDbAccount ? () => setNewAccount(null) : undefined}
        />
      )}

      {yamlAccounts.length > 0 && (
        <div className="mx-auto w-full max-w-md px-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {hasDbAccount
                ? t('login.serverAccounts')
                : newAccount
                  ? t('login.otherAccounts')
                  : t('login.accounts')}
            </h3>

            <div className="flex flex-col gap-1.5">
              {yamlAccounts.map((account, index) => {
                if (!account) return null;
                const isActive = newAccount?.id === account.id;
                const isThisLoading = isActive && loading;

                return (
                  <button
                    key={`${account.id}-${index}`}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-md border bg-transparent px-3 py-2.5 transition-colors ${
                      isActive
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                    disabled={isActive || loading}
                    onClick={handleClick(account)}
                  >
                    <div className="flex items-center gap-2">
                      <Lock size={13} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {account.type === 'sso'
                          ? t('login.ssoAccount')
                          : account.name}
                      </span>
                    </div>

                    {isThisLoading ? (
                      <Loader2
                        className="animate-spin text-primary"
                        size={14}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t('login.login')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
