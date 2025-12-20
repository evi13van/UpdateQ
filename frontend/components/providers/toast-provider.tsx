"use client";

import { Toaster } from "react-hot-toast";

export const ToastProvider = () => {
  return (
    <Toaster 
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }}
    />
  );
};
