"use client";

import { createContext, useContext } from "react";
import { createPortal } from "react-dom";

export const PageHeaderContext = createContext<HTMLElement | null>(null);

export function AppPageHeading({ children }: { children: React.ReactNode }) {
  const header = useContext(PageHeaderContext);
  return header ? createPortal(children, header) : children;
}
