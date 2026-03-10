import { connectGlobalCountSocket } from "../api/globalTicket";
import { applyUserUpdate } from "../store/slices/authSlice";
import { setError } from "../store/slices/errorSlice";
import {
  clearError as clearTicketError,
  updateCount,
} from "../store/slices/ticketSlice";

let disconnectFn: (() => void) | null = null;

export function connect(
  userId: number,
  dispatch: (
    action: ReturnType<
      | typeof applyUserUpdate
      | typeof updateCount
      | typeof clearTicketError
      | typeof setError
    >,
  ) => void,
): void {
  if (disconnectFn) {
    disconnectFn();
  }

  disconnectFn = connectGlobalCountSocket(
    (count: number) => {
      dispatch(updateCount(count));
      dispatch(clearTicketError());
    },
    (update) => {
      const payload = {
        ...(update.supplies !== undefined
          ? { printer_supplies: update.supplies }
          : {}),
        ...(update.money !== undefined ? { money: update.money } : {}),
        ...(update.tickets_contributed !== undefined
          ? { tickets_contributed: update.tickets_contributed }
          : {}),
        ...(update.tickets_withdrawn !== undefined
          ? { tickets_withdrawn: update.tickets_withdrawn }
          : {}),
        ...(update.gold !== undefined ? { gold: update.gold } : {}),
        ...(update.autoprinters !== undefined
          ? { autoprinters: update.autoprinters }
          : {}),
        ...(update.credit_value !== undefined
          ? { credit_value: update.credit_value }
          : {}),
        ...(update.credit_generation_level !== undefined
          ? { credit_generation_level: update.credit_generation_level }
          : {}),
        ...(update.credit_capacity_level !== undefined
          ? { credit_capacity_level: update.credit_capacity_level }
          : {}),
        ...(update.auto_buy_supplies_purchased !== undefined
          ? { auto_buy_supplies_purchased: update.auto_buy_supplies_purchased }
          : {}),
        ...(update.auto_buy_supplies_active !== undefined
          ? { auto_buy_supplies_active: update.auto_buy_supplies_active }
          : {}),
      };

      if (Object.keys(payload).length > 0) {
        dispatch(applyUserUpdate(payload));
      }
    },
    (status: "open" | "closed" | "error") => {
      if (status === "error") {
        dispatch(setError("WebSocket connection error"));
      } else if (status === "closed") {
        console.log("WebSocket disconnected");
      }
    },
    userId,
  );
}

export function disconnect(): void {
  if (disconnectFn) {
    disconnectFn();
    disconnectFn = null;
  }
}
