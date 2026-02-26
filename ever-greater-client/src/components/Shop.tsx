import { JSX } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { buySuppliesThunk } from "../store/slices/authSlice";

type ShopProps = {
  onPurchaseError?: (error: string) => void;
};

function Shop({ onPurchaseError }: ShopProps): JSX.Element {
  const dispatch = useAppDispatch();
  const {
    user: currentUser,
    isLoading,
    error,
  } = useAppSelector((state) => state.auth);

  const handleBuySupplies = () => {
    if (isLoading) return;
    dispatch(buySuppliesThunk()).then((result) => {
      if (result.type === buySuppliesThunk.rejected.type) {
        onPurchaseError?.(result.payload as string);
      }
    });
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  const money = currentUser.money ?? 0;
  const moneyCost = 10;
  const canAfford = money >= moneyCost;
  const isButtonDisabled = isLoading || !canAfford;

  return (
    <div className="shop-container">
      <div className="shop-header">
        <h2 className="money-display">
          Money:
          <span className="money-value"> ${money}</span>
        </h2>
      </div>

      <div className="shop-item">
        <div className="shop-item-details">
          <span className="shop-item-name">100 Supplies for </span>
          <span className="shop-item-price">${moneyCost}</span>
        </div>
        <button
          onClick={handleBuySupplies}
          className="buy-button demo-button"
          disabled={isButtonDisabled}
        >
          {isLoading
            ? "Purchasing..."
            : canAfford
              ? "Buy"
              : "Insufficient Money"}
        </button>
      </div>

      {error && <p className="shop-error-message">{error}</p>}
    </div>
  );
}

export default Shop;
