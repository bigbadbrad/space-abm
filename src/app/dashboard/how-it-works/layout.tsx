import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ABM How It Works | Space GTM',
  description: 'How the Space GTM system works end-to-end.',
};

export default function ABMHowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
