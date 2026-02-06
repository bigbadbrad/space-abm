import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ChartPie as ChartPieIcon } from '@phosphor-icons/react/dist/ssr/ChartPie';
import { Gauge as GaugeIcon } from '@phosphor-icons/react/dist/ssr/Gauge';
import { GearSix as GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { PlugsConnected as PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { XSquare } from '@phosphor-icons/react/dist/ssr/XSquare';
import { Circle as CircleIcon } from '@phosphor-icons/react/dist/ssr/Circle';
import { Calendar as CalendarIcon } from '@phosphor-icons/react/dist/ssr/Calendar';
import { ChartLine as ChartLineIcon } from '@phosphor-icons/react/dist/ssr/ChartLine';
import { Lock as LockIcon } from '@phosphor-icons/react/dist/ssr/Lock';
import { Warning as WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning';
import { FileText as FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText';
import { CurrencyDollar as CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar';
import { Funnel as FunnelIcon } from '@phosphor-icons/react/dist/ssr/Funnel';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { ShieldStar as ShieldStarIcon } from '@phosphor-icons/react/dist/ssr/ShieldStar';
import { RocketLaunch as RocketLaunchIcon } from '@phosphor-icons/react/dist/ssr/RocketLaunch';
import { BuildingOffice as BuildingOfficeIcon } from '@phosphor-icons/react/dist/ssr/BuildingOffice';
import { Columns as ColumnsIcon } from '@phosphor-icons/react/dist/ssr/Columns';

export const navIcons = {
  'chart-pie': ChartPieIcon,
  gauge: GaugeIcon,
  funnel: FunnelIcon,
  'magnifying-glass': MagnifyingGlassIcon,
  'gear-six': GearSixIcon,
  'plugs-connected': PlugsConnectedIcon,
  'x-square': XSquare,
  user: UserIcon,
  users: UsersIcon,
  satellite: CircleIcon,
  plug: PlugsConnectedIcon,
  calendar: CalendarIcon,
  'chart-line': ChartLineIcon,
  'building-office': BuildingOfficeIcon,
  columns: ColumnsIcon,
  lock: LockIcon,
  warning: WarningIcon,
  'file-text': FileTextIcon,
  'currency-dollar': CurrencyDollarIcon,
  'shield-star': ShieldStarIcon,
  'rocket-launch': RocketLaunchIcon,
} as Record<string, Icon>;
