# woia-technology-operations contract


Technical bindings, access and recovery with exact authority. Core owns work/runtime mechanics; Software owns engineering/deployment methodology. Restore never undoes external effects or revives revoked grants.

## Actions

- `technology.binding.read`
- `technology.binding.apply`
- `technology.access.apply`
- `technology.access.revoke`
- `technology.health.observe`
- `technology.inventory.read`
- `technology.backup.observe`
- `technology.restore.execute`
- `technology.change.execute`
- `technology.recovery.reconcile`

## Authority

All calls require authenticated actor/Task, organization/scope/action, current conflict-free source, unexpired unrevoked authority and no hold. Writes require Technology owner/writer and non-self exact approval over command digest and current policy/binding/authority revisions. Host supplies trusted verified context; untrusted inputs cannot self-assert grants. No account/limits/legal policy is invented.

## State and adapter port

Provider returns immutable JSON state; caller persists with atomic CAS against expected revision. Intent is not remote success. UNKNOWN is durably claimed before network dispatch, retained on ambiguous responses/crashes and reconciled only with source/evidence. Cross-store transactions are not claimed. Idempotency is organization/scope/effect ID plus exact digest.

Adapter port requires qualification PASS on exact binding, execute and durable persist methods. Real account/host/credential qualification: NOT_RUN. No external calls occurred. Schema storage is not runtime enforcement; synthetic tests prove deterministic guards only. No backend is selected.
