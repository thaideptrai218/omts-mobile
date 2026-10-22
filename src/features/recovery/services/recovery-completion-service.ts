export type RecoveryCompletionResult =
  | Readonly<{ status: "completed" }>
  | Readonly<{ status: "attempt-invalid" }>;

export type RecoveryCompletionService = Readonly<{
  complete(input: Readonly<{ newPassword: string }>): Promise<RecoveryCompletionResult>;
}>;
