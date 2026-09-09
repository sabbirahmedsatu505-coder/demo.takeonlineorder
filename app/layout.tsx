import './globals.css';
import { CartProvider } from '@/lib/cart-context';

export const metadata = {
  title: 'Your Restaurant | Order Online',
  description: 'Order online directly — fresh food, no commission fees.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
