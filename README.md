# **ThunderHub - Lightning Node Manager**

**Documentation has moved!** Find the documentation [here](http://docs.thunderhub.io/).

## XBT fork notes

This branch (`xbt`) adapts ThunderHub to an LND node on the XBT (Bitcoin
BLAKE2b) chain.

- **Channel notes out of the box.** The Docker image enables SQLite by default
  (`DB_TYPE=sqlite`, `DB_SQLITE_PATH=/data/thunderhub.db`). Migrations run on
  start and, when `DB_ENCRYPTION_KEY` is not set, a random key is generated and
  kept next to the database (`/data/.thub-db-key`, mode 0600, or
  `DB_ENCRYPTION_KEY_PATH`). Accounts from `ACCOUNT_CONFIG_PATH` log in exactly
  as before (no setup screen) and their notes are stored by node public key.
  **The database directory must be writable** by the container user (uid
  1000). If it is read-only the server still starts, but notes are disabled.
  To keep the credentials volume read-only, mount a separate writable volume
  and point `DB_SQLITE_PATH` at it (e.g. `-v /srv/thub-db:/db` and
  `DB_SQLITE_PATH=/db/thunderhub.db`). Set `DB_TYPE=` to disable the database.
- **Spanish by default.** The interface is translated to Spanish with English
  as fallback; switch in Settings > Interface > Language (stored per browser).
- **Coin control channel opens.** Open channel > Funding > Coin control (PSBT):
  pick the exact UTXOs, set a fee rate down to 0.1 sat/vB and review the
  transaction before it is signed. Uses LND's PSBT funding flow
  (`OpenChannel` with a PSBT shim, WalletKit `FundPsbt` with `sat_per_kw`,
  `FinalizePsbt`, `FundingStateStep`). Most XBT pools only mine >= 1 sat/vB
  and a peer forgets an unconfirmed channel after ~2016 blocks.
- **CPFP.** Chain > Transactions offers "Acelerar (CPFP)" for unconfirmed
  transactions with a wallet output (WalletKit `BumpFee` with a bounded
  budget). Channel funding transactions can not be RBF'd.
- `MEMPOOL_URL` keeps working as upstream (e.g. `https://mempool.kilombino.com`).
