import { printTicketThunk } from "../store/gameOperationThunks";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export function useGame() {
  const dispatch = useAppDispatch();
  const { count, error, isLoading } = useAppSelector((state) => state.ticket);
  const user = useAppSelector((state) => state.auth.user);

  const supplies = user?.printer_supplies ?? 0;
  const autoBuyCanPrint =
    user?.auto_buy_supplies_purchased && user?.auto_buy_supplies_active;
  const isPrintDisabled = supplies === 0 && !autoBuyCanPrint;

  const printTicket = () => {
    dispatch(printTicketThunk());
  };

  return { count, error, isLoading, supplies, isPrintDisabled, printTicket };
}
