import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLoginAmbossMutation } from '../../../../graphql/mutations/__generated__/loginAmboss.generated';
import { useGetAmbossLoginTokenLazyQuery } from '../../../../graphql/queries/__generated__/getAmbossLoginToken.generated';
import { useAmbossUser } from '../../../../hooks/UseAmbossUser';
import { appendBasePath } from '../../../../utils/basePath';
import { QuickCard, QuickTitle } from '../QuickActions';
import { t } from '@/i18n';

export const AmbossCard = () => {
  const { user } = useAmbossUser();

  const [login, { loading }] = useLoginAmbossMutation({
    onCompleted: () => toast.success(t('home.amboss.loggedIn')),
    onError: () => toast.error(t('home.amboss.loginError')),
    refetchQueries: ['GetAmbossUser', 'GetChannels'],
  });

  const [getToken, { data, loading: tokenLoading }] =
    useGetAmbossLoginTokenLazyQuery({
      fetchPolicy: 'network-only',
      onError: () => toast.error(t('home.buyChannel.authTokenError')),
    });

  useEffect(() => {
    if (!data?.getAmbossLoginToken || tokenLoading) {
      return;
    }
    if (!window?.open) return;

    const url = data.getAmbossLoginToken;
    (window as any).open(url, '_blank').focus();
  }, [data, tokenLoading]);

  const isLoading = user ? tokenLoading : loading;
  const label = isLoading
    ? t('common.loading')
    : user
      ? t('home.amboss.goTo')
      : t('home.amboss.login');

  const handleClick = () => {
    if (user) {
      if (!tokenLoading) getToken();
    } else {
      if (!loading) login();
    }
  };

  return (
    <QuickCard
      className="hover:border-purple-500/30 hover:bg-purple-500/5"
      onClick={handleClick}
    >
      <img
        src={appendBasePath('/assets/amboss_icon.png')}
        width={16}
        height={16}
        alt="Amboss Logo"
      />
      <QuickTitle>{label}</QuickTitle>
    </QuickCard>
  );
};
