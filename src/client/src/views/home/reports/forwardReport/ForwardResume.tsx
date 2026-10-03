import { FC, useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { Price } from '../../../../components/price/Price';
import { useGetForwardsListQuery } from '../../../../graphql/queries/__generated__/getForwards.generated';
import { t } from '@/i18n';

type ArrayType = { fee: number; fee_mtokens: string; tokens: number };

type TypeOptionProps = {
  label: string;
  value: string;
};

type ForwardResumeProps = {
  type: TypeOptionProps;
};

export const ForwardResume: FC<ForwardResumeProps> = ({ type }) => {
  const { data, loading } = useGetForwardsListQuery({
    variables: { days: 365 },
    errorPolicy: 'ignore',
  });

  const values = useMemo(() => {
    const day: ArrayType[] = [];
    const week: ArrayType[] = [];
    const month: ArrayType[] = [];

    const forwards = data?.getForwards.list || [];

    if (!forwards.length) return { day: 0, week: 0, month: 0, year: 0 };

    const today = new Date();

    forwards.forEach(f => {
      if (!f) return;
      const forwardDate = new Date(f.created_at);

      if (differenceInDays(today, forwardDate) < 1) {
        day.push(f);
      }
      if (differenceInDays(today, forwardDate) < 7) {
        week.push(f);
      }
      if (differenceInDays(today, forwardDate) < 30) {
        month.push(f);
      }
    });

    const reduce = (arr: ArrayType[]) =>
      arr.reduce((p, c) => {
        if (!c) return p;
        if (type.value === 'fee') return p + Number.parseInt(c.fee_mtokens);
        if (type.value === 'tokens') return p + c.tokens;
        return p + 1;
      }, 0);

    return {
      day: reduce(day),
      week: reduce(week),
      month: reduce(month),
      year: reduce(forwards as ArrayType[]),
    };
  }, [data, type]);

  if (loading) return null;

  const renderValue = (value: number) => {
    if (type.value === 'count') {
      return <span className="text-sm font-medium font-mono">{value}</span>;
    }
    if (type.value === 'fee') {
      return (
        <span className="text-sm font-medium font-mono">
          <Price amount={Math.floor(value / 1000)} />
        </span>
      );
    }
    return (
      <span className="text-sm font-medium font-mono">
        <Price amount={value} />
      </span>
    );
  };

  const items = [
    { label: t('home.forwards.day'), value: values.day },
    { label: t('home.forwards.week'), value: values.week },
    { label: t('home.forwards.month'), value: values.month },
    { label: t('home.forwards.year'), value: values.year },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(item => (
        <div key={item.label} className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-muted-foreground">{item.label}</span>
          {renderValue(item.value)}
        </div>
      ))}
    </div>
  );
};
