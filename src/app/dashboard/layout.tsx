import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Space ABM',
  description: 'Purpose-built ABM for space services.',
};

export default function ABMRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
