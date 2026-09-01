export const USER_ACTION_REQUIRED = "USER_ACTION_REQUIRED";

export class MutationGateError extends Error {
  readonly code = USER_ACTION_REQUIRED;
  constructor(message: string) {
    super(message);
    this.name = "MutationGateError";
  }
}

export interface GateInput {
  allowMutations: boolean;
  explicitUserIntent?: boolean;
}

function intentOn(value: boolean | undefined): boolean {
  return value === true;
}

export function assertExplicitIntent(explicitUserIntent: boolean | undefined, action: string): void {
  if (!intentOn(explicitUserIntent)) {
    throw new MutationGateError(
      `${USER_ACTION_REQUIRED}: explicit_user_intent must be true to ${action}. Confirm with the user first.`
    );
  }
}

export function assertMutationsEnabled(allowMutations: boolean, action: string): void {
  if (!allowMutations) {
    throw new MutationGateError(
      `${USER_ACTION_REQUIRED}: IFOOD_ALLOW_MUTATIONS must be enabled to ${action}. Default is read-only and never pays.`
    );
  }
}

export function assertCartWriteAllowed(input: GateInput): void {
  assertMutationsEnabled(input.allowMutations, "change the iFood cart");
  assertExplicitIntent(input.explicitUserIntent, "change the iFood cart");
}

export function assertCheckoutAllowed(input: GateInput): void {
  assertMutationsEnabled(input.allowMutations, "place an iFood order or charge money");
  assertExplicitIntent(input.explicitUserIntent, "place an iFood order or charge money");
}

export function assertLogoutAllowed(explicitUserIntent: boolean | undefined): void {
  assertExplicitIntent(explicitUserIntent, "clear the local iFood token");
}

export function assertAddressWriteAllowed(explicitUserIntent: boolean | undefined): void {
  assertExplicitIntent(explicitUserIntent, "change iFood delivery addresses");
}
