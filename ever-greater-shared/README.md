# ever-greater-shared

Shared domain logic and contract types for the Ever Greater client and server.

## Public Export Surface

Consumers should import from the package root only:

- Resource types and helpers from `resources`
- Operation types, definitions, and helpers from `operations`
- WebSocket message contract types from `messages`

Current root exports include:

- `ResourceType`, `RESOURCE_DB_FIELDS`, `DB_FIELD_TO_RESOURCE`
- `getUserResource`, `setUserResource`, `hasResources`
- `OperationId`, `operations`, `getOperationCost`, `getOperationGain`
- `canAfford`, `applyTransaction`, `validateOperation`, `evaluateResourceAmount`
- `GlobalCountUpdate`, `UserResourceFields`, `UserResourceUpdate`, `WebSocketMessage`
- `User`, `ResourceAmount`, `Operation`, `OperationContext`, `ResourceCalculator`, `ValidationResult`

Anything not exported from the package root is internal and may change without notice.

## Deprecation Policy

- Public exports are considered stable within the `1.x` major line.
- Deprecations should be announced in this package changelog before removal.
- Removals or breaking signature changes require a new major version.
- New exports may be added in minor releases if they do not break existing consumers.
