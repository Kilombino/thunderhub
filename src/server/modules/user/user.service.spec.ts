jest.mock('../accounts/accounts.service', () => ({
  AccountsService: class {},
}));

import { UserService } from './user.service';

const makeService = ({
  db,
  accounts,
  userCount = 0,
}: {
  db: boolean;
  accounts: Record<string, unknown>;
  userCount?: number;
}) => {
  const drizzle = db
    ? {
        db: {
          select: () => ({ from: async () => [{ count: userCount }] }),
        },
        schema: { users: {} },
      }
    : null;

  return new UserService(
    drizzle as any,
    {} as any,
    { getAllAccounts: () => accounts } as any
  );
};

describe('UserService.needsSetup', () => {
  it('is false without a database', async () => {
    expect(await makeService({ db: false, accounts: {} }).needsSetup()).toBe(
      false
    );
  });

  it('is true with a database, no users and no config accounts', async () => {
    expect(await makeService({ db: true, accounts: {} }).needsSetup()).toBe(
      true
    );
  });

  it('is false when config-file accounts exist', async () => {
    expect(
      await makeService({ db: true, accounts: { abc: {} } }).needsSetup()
    ).toBe(false);
  });

  it('is false once a database user exists', async () => {
    expect(
      await makeService({ db: true, accounts: {}, userCount: 1 }).needsSetup()
    ).toBe(false);
  });
});
