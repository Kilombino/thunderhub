import { GetClosedChannelsQuery } from '../../../../graphql/queries/__generated__/getClosedChannels.generated';
import { t } from '@/i18n';

export const getAliasFromClosedChannels = (
  channelId: string,
  channels: GetClosedChannelsQuery['getClosedChannels']
): { alias: string; closed: boolean } => {
  if (!channels) return { alias: t('home.forwards.unknown'), closed: false };

  const channel = channels.find(c => c?.id === channelId);

  if (channel?.partner_node_info.node?.alias) {
    return { alias: channel.partner_node_info.node.alias, closed: true };
  }

  return { alias: t('home.forwards.unknown'), closed: false };
};
