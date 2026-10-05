export type CurrencyProvider = {
  id: string;
  currency: string;
  currencySymbol: string;
  name: string;
  referralUrl: string;
  description: string;
  localStorageKey: string;
  methods: ('lightning' | 'onchain')[];
};

// XBT fork: Bringin (sats <-> EUR) works only on the SHA-256 Lightning network and
// on-chain Bitcoin; it cannot receive or send XBT, so no fiat provider is offered.
export const CURRENCY_PROVIDERS: CurrencyProvider[] = [];
