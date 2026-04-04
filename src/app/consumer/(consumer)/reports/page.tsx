import { redirect } from 'next/navigation';

import { paths } from '@/paths';

export default function ConsumerReportsRedirect(): never {
  redirect(paths.consumer.dashboard);
}
