"use client";

import { useEffect } from "react";

type Props = {
  transactionId: number;
};

export function ScrollToWalletHighlight({ transactionId }: Props) {
  useEffect(() => {
    const el = document.querySelector(`[data-tx-id="${transactionId}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [transactionId]);

  return null;
}
