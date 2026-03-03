import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consumer | SpaceGTM',
  description: 'Consumer surface for SpaceGTM.',
};

export default function ConsumerRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
