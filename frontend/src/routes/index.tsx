import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import {
  AlertTriangle,
  Calendar,
  MapPin,
  Package,
  ShoppingCart,
  User,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Stat } from '@/components/ui/Stat';
import { authClient } from '@/lib/auth-client';
import { mockFetch } from '@/lib/mock-api';
import { dashboardAlerts, dashboardKpis, recentActivity, upcomingVisits } from '@/lib/mock-data';
import type { ActivityType } from '@/lib/mock-data';

export const Route = createFileRoute('/')({
  component: Dashboard,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) {
      throw redirect({ to: '/sign-in' });
    }
  },
});

const activityIconMap: Record<ActivityType, LucideIcon> = {
  lead: UserPlus,
  order: ShoppingCart,
  stock: Package,
  customer: User,
  visit: MapPin,
};

function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => mockFetch(dashboardKpis),
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => mockFetch(recentActivity),
  });

  const { data: visits, isLoading: visitsLoading } = useQuery({
    queryKey: ['dashboard', 'visits'],
    queryFn: () => mockFetch(upcomingVisits),
  });

  const { data: alerts } = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: () => mockFetch(dashboardAlerts),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Visão geral do negócio" />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpisLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} padding="md">
                <Skeleton height="h-3" width="w-24" className="mb-3" />
                <Skeleton height="h-7" width="w-32" className="mb-2" />
                <Skeleton height="h-3" width="w-20" />
              </Card>
            ))
          : kpis?.map((kpi) => (
              <Stat key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} />
            ))}
      </div>

      {/* Alertas */}
      {alerts && alerts.length > 0 && (
        <Card padding="md">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <AlertTriangle size={15} className="text-amber-500" />
            Alertas
          </h2>
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex items-start gap-2">
                <Badge variant={alert.severity === 'danger' ? 'danger' : 'warning'}>
                  {alert.severity === 'danger' ? 'Crítico' : 'Atenção'}
                </Badge>
                <span className="text-sm text-neutral-700">{alert.message}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Actividade recente */}
        <Card padding="md" className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Actividade recente</h2>
          {activityLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height="h-8" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {activity?.map((event) => {
                const Icon = activityIconMap[event.type];
                return (
                  <li key={event.id} className="flex items-start gap-3 py-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                      <Icon size={13} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-neutral-800">{event.description}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {event.actor} · {event.timestamp}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Próximas visitas */}
        <Card padding="md">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Calendar size={14} className="text-emerald-600" />
            Próximas visitas
          </h2>
          {visitsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height="h-14" />
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {visits?.map((visit) => (
                <li
                  key={visit.id}
                  className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"
                >
                  <p className="text-sm font-medium text-neutral-900">{visit.floristName}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin size={11} />
                    {visit.city}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="info">{visit.scheduledDate}</Badge>
                    <span className="text-xs text-neutral-400">{visit.salesRep}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
