import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SpaceGTM',
  description: 'The first ABM platform built for missions, not just leads.',
};

export default function ABMRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
