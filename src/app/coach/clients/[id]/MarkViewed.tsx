"use client";

import { useEffect } from "react";
import { touchClientViewed } from "@/app/coach/actions";

// Fires touchClientViewed as a real client-triggered action (not awaited
// during the page's own server render) so its revalidatePath call
// actually takes effect -- see the comment on touchClientViewed itself.
export function MarkViewed({ clientId }: { clientId: string }) {
  useEffect(() => {
    touchClientViewed(clientId);
  }, [clientId]);

  return null;
}
