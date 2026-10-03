import type { PartialMessages } from '../../index';
import { common } from './common';
import { login } from './login';
import { nav } from './nav';
import { home } from './home';
import { wallet } from './wallet';
import { channels } from './channels';
import { openChannel } from './openChannel';
import { coinControl } from './coinControl';
import { chain } from './chain';
import { settings } from './settings';

export const es: PartialMessages = {
  common,
  login,
  nav,
  home,
  wallet,
  channels,
  openChannel,
  coinControl,
  chain,
  settings,
};
