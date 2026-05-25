import React from 'react';
import { ThirdwebProvider } from 'thirdweb/react';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <ThirdwebProvider>
    {children}
  </ThirdwebProvider>
);
