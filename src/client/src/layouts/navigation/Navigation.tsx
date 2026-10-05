import { FC } from 'react';
import {
  Home,
  Cpu,
  Server,
  Settings,
  Shield,
  GitPullRequest,
  Link as LinkIcon,
  Users,
  Grid,
  Globe,
  ExternalLink,
  LucideProps,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useConfigState } from '../../context/ConfigContext';
import { Link } from '../../components/link/Link';
import { useNodePath } from '../../hooks/useNodeSlug';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { Badge } from '../../components/ui/badge';
import { SideSettings } from './sideSettings/SideSettings';
import { t, TranslationKey } from '@/i18n';

type Icon = FC<LucideProps>;

const BetaBadge = ({ withTooltip = true }: { withTooltip?: boolean }) => {
  const badge = (
    <Badge
      variant="outline"
      className="h-3.5 rounded-sm px-1 py-0 text-[8px] font-semibold uppercase tracking-wide border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-0.5"
    >
      {t('nav.beta')}
    </Badge>
  );

  if (!withTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-block cursor-default">{badge}</span>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="text-xs max-w-52 bg-popover text-popover-foreground border border-border shadow-md [&_svg]:hidden!"
      >
        {t('nav.betaTooltip')}
      </TooltipContent>
    </Tooltip>
  );
};

const HOME = '/home';
const DASHBOARD = '/dashboard';
const PEERS = '/peers';
const CHANNEL = '/channels';
const TRANS = '/transactions';
const FORWARDS = '/forwards';
const CHAIN_TRANS = '/chain';
const TOOLS = '/tools';
const SETTINGS = '/settings';
const AMBOSS = '/amboss';

interface NavItem {
  /** Translation key of the label */
  title: TranslationKey;
  icon: Icon;
  link?: string;
  href?: string;
  beta?: boolean;
}

interface NavSection {
  /** Translation key of the heading */
  title: TranslationKey;
  items: NavItem[];
}

const mainNav: NavItem[] = [
  { title: 'nav.items.home', link: HOME, icon: Home },
  { title: 'nav.items.dashboard', link: DASHBOARD, icon: Grid },
  { title: 'nav.items.peers', link: PEERS, icon: Users },
  { title: 'nav.items.channels', link: CHANNEL, icon: Cpu },
  { title: 'nav.items.transactions', link: TRANS, icon: Server },
  { title: 'nav.items.forwards', link: FORWARDS, icon: GitPullRequest },
  { title: 'nav.items.chain', link: CHAIN_TRANS, icon: LinkIcon },
  { title: 'nav.items.tools', link: TOOLS, icon: Shield },
];

interface NavigationProps {
  isBurger?: boolean;
  setOpen?: (state: boolean) => void;
}

const AMBOSS_SECTION: NavSection = {
  title: 'nav.sections.amboss',
  items: [{ title: 'nav.items.services', link: AMBOSS, icon: Globe }],
};

export const Navigation = ({ isBurger, setOpen }: NavigationProps) => {
  const nodePath = useNodePath();
  const { sidebar } = useConfigState();

  // XBT fork: Magma, Taproot Assets and Swap are Amboss / SHA-256 Lightning services that
  // do not exist on the BLAKE2b chain, so only Amboss's account page stays.
  const sections: NavSection[] = [AMBOSS_SECTION];

  const renderNavButton = (item: NavItem, open = true) => {
    const isActive = !!item.link && nodePath === item.link;
    const NavIcon = item.icon;
    const key = item.link ?? item.href ?? item.title;

    const content = (
      <div
        className={cn(
          'group relative flex items-center gap-2.5 rounded-md text-xs font-medium transition-colors',
          open ? 'px-2.5 py-1.5' : 'justify-center p-2',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        )}
      >
        <NavIcon size={15} className="shrink-0" />
        {open && (
          <span className="flex flex-1 items-center justify-between">
            <span className="flex items-center gap-1.5">
              {t(item.title)}
              {item.beta && <BetaBadge />}
            </span>
            {item.href && (
              <ExternalLink size={11} className="shrink-0 opacity-60" />
            )}
          </span>
        )}
      </div>
    );

    const button = item.href ? (
      <a
        key={key}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline"
      >
        {content}
      </a>
    ) : (
      <Link key={key} to={item.link}>
        {content}
      </Link>
    );

    if (!open) {
      return (
        <Tooltip key={key}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            <span className="flex items-center gap-1.5">
              {t(item.title)}
              {item.beta && <BetaBadge withTooltip={false} />}
            </span>
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  const renderBurgerNav = (item: NavItem) => {
    const isActive = !!item.link && nodePath === item.link;
    const NavIcon = item.icon;
    const key = item.link ?? item.href ?? item.title;

    const content = (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
          isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        )}
        onClick={() => setOpen && setOpen(false)}
      >
        <NavIcon size={16} />
        <span className="flex flex-1 items-center justify-between">
          <span className="flex items-center gap-1.5">
            {t(item.title)}
            {item.beta && <BetaBadge />}
          </span>
          {item.href && (
            <ExternalLink size={12} className="shrink-0 opacity-60" />
          )}
        </span>
      </div>
    );

    if (item.href) {
      return (
        <a
          key={key}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline"
        >
          {content}
        </a>
      );
    }

    return (
      <Link key={key} to={item.link}>
        {content}
      </Link>
    );
  };

  if (isBurger) {
    return (
      <div className="px-4 py-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1">
          {t('nav.navigation')}
        </div>
        <nav className="flex flex-col gap-0.5">
          {mainNav.map(item => renderBurgerNav(item))}
        </nav>
        {sections.map(section => (
          <div key={section.title}>
            <div className="my-2 mx-3 h-px bg-border/60" />
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1">
              {t(section.title)}
            </div>
            <nav className="flex flex-col gap-0.5">
              {section.items.map(item => renderBurgerNav(item))}
            </nav>
          </div>
        ))}
        <div className="my-2 mx-3 h-px bg-border/60" />
        <nav className="flex flex-col gap-0.5">
          {renderBurgerNav({
            title: 'nav.items.settings',
            link: SETTINGS,
            icon: Settings,
          })}
        </nav>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'hidden md:flex flex-col shrink-0 transition-[width] duration-200 border-r border-border/60',
        sidebar ? 'w-45' : 'w-13'
      )}
    >
      <div className="sticky top-19.25 p-4 pr-2">
        <div className="flex flex-col h-full">
          {sidebar && (
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2.5 mb-1">
              {t('nav.menu')}
            </div>
          )}
          <nav
            className={cn(
              'flex flex-col gap-0.5 w-full',
              !sidebar && 'items-center'
            )}
          >
            {mainNav.map(item => renderNavButton(item, sidebar))}
          </nav>
          {sections.map(section => (
            <div key={section.title} className="flex flex-col">
              <div
                className={cn(
                  'my-2 h-px bg-border/60',
                  sidebar ? 'mx-2.5' : 'mx-2'
                )}
              />
              {sidebar && (
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2.5 mb-1">
                  {t(section.title)}
                </div>
              )}
              <nav
                className={cn(
                  'flex flex-col gap-0.5 w-full',
                  !sidebar && 'items-center'
                )}
              >
                {section.items.map(item => renderNavButton(item, sidebar))}
              </nav>
            </div>
          ))}
          <div
            className={cn(
              'my-2 h-px bg-border/60',
              sidebar ? 'mx-2.5' : 'mx-2'
            )}
          />
          <SideSettings />
        </div>
      </div>
    </div>
  );
};
