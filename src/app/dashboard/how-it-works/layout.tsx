import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ABM How It Works | Full Orbit',
  description: 'How the Full Orbit ABM system works end-to-end.',
};

export default function ABMHowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
