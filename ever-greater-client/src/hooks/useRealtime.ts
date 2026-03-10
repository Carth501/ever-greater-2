import { useAppSelector } from "../store/hooks";

export function useRealtime() {
  const isConnected = useAppSelector((state) => state.realtime.isConnected);
  return { isConnected };
}
