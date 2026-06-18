import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import App from './App.tsx';
import './index.css';

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        components: 'buttons',
        currency: 'USD',
        intent: 'capture',
      }}
    >
      <App />
    </PayPalScriptProvider>
  </StrictMode>
);
