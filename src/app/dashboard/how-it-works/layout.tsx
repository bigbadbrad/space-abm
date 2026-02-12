import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ABM How It Works | SpaceGTM',
  description: 'How the SpaceGTM system works end-to-end.',
};

export default function ABMHowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
