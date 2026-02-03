import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ABM How It Works | Space ABM',
  description: 'How the Space ABM system works end-to-end.',
};

export default function ABMHowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
