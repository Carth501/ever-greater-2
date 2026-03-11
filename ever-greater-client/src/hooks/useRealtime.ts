import { useAppSelector } from "../store/hooks";

export function useRealtime() {
  const { isConnected, isReconnecting } = useAppSelector(
    (state) => state.realtime,
  );
  return { isConnected, isReconnecting };
}
