import { Heart } from 'lucide-react';
import { QuickCard, QuickTitle } from '../QuickActions';
import { t } from '@/i18n';

type SupportCardProps = {
  callback: () => void;
};

export const SupportCard = ({ callback }: SupportCardProps) => (
  <QuickCard
    onClick={callback}
    className="hover:border-pink-500/30 hover:bg-pink-500/5"
  >
    <Heart size={16} className="text-pink-500" />
    <QuickTitle>{t('home.donate.donate')}</QuickTitle>
  </QuickCard>
);
