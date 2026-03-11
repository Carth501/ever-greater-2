import { useAppSelector } from "../store/hooks";

export function useRealtime() {
  const { isConnected, isReconnecting, lastUpdateAt } = useAppSelector(
    (state) => state.realtime,
  );
  return { isConnected, isReconnecting, lastUpdateAt };
}
