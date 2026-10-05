import { Cable, Rocket } from 'lucide-react';
import { useState } from 'react';
import { OpenChannel } from './OpenChannel';
import { BuyChannel } from './BuyChannel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { t } from '@/i18n';

type DialogState = 'none' | 'open' | 'buy';

export const Liquidity = () => {
  const [openDialog, setOpenDialog] = useState<DialogState>('none');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('home.liquidity.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              className="flex cursor-pointer items-center justify-center gap-2 rounded border border-border bg-transparent p-3 text-primary transition-colors hover:border-primary"
              onClick={() => setOpenDialog('open')}
            >
              <Cable size={20} />
              <span className="text-sm text-muted-foreground">
                {t('home.liquidity.openChannel')}
              </span>
            </button>
            <button
              className="flex cursor-pointer items-center justify-center gap-2 rounded border border-border bg-transparent p-3 text-primary transition-colors hover:border-primary"
              onClick={() => setOpenDialog('buy')}
            >
              <Rocket size={20} />
              <span className="text-sm text-muted-foreground">
                {t('home.liquidity.buyInbound')}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={openDialog === 'open'}
        onOpenChange={open => !open && setOpenDialog('none')}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('home.liquidity.openChannelTitle')}</DialogTitle>
            <DialogDescription>
              {t('home.liquidity.openChannelDescription')}
            </DialogDescription>
          </DialogHeader>
          <OpenChannel closeCbk={() => setOpenDialog('none')} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={openDialog === 'buy'}
        onOpenChange={open => !open && setOpenDialog('none')}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('home.liquidity.buyInbound')}</DialogTitle>
            <DialogDescription>
              {t('home.liquidity.buyInboundDescription')}
            </DialogDescription>
          </DialogHeader>
          <BuyChannel />
        </DialogContent>
      </Dialog>
    </>
  );
};
