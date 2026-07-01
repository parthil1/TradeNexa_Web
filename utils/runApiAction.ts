import type { Dispatch, SetStateAction } from "react";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

export interface AsyncOperationState<T> {
  loading: boolean;
  success: boolean;
  error: string | null;
  response: T | null;
}

export const initialOpState = <T,>(): AsyncOperationState<T> => ({
  loading: false,
  success: false,
  error: null,
  response: null,
});

interface RunApiActionOptions<T> {
  setState: Dispatch<SetStateAction<AsyncOperationState<T>>>;
  action: () => Promise<T>;
  successMessage?: string;
  fallbackError?: string;
  showToast?: boolean;
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: string }).message;
    if (message) return message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Shared try/catch wrapper for auth API actions */
export async function runApiAction<T>({
  setState,
  action,
  successMessage,
  fallbackError = "Something went wrong. Please try again.",
  showToast = true,
}: RunApiActionOptions<T>): Promise<T | null> {
  setState({ loading: true, success: false, error: null, response: null });

  try {
    const result = await action();
    setState({ loading: false, success: true, error: null, response: result });
    if (showToast && successMessage) showSuccessToast(successMessage);
    return result;
  } catch (err: unknown) {
    const errorMsg = getErrorMessage(err, fallbackError);
    setState({ loading: false, success: false, error: errorMsg, response: null });
    if (showToast) showErrorToast(errorMsg);
    return null;
  }
}
