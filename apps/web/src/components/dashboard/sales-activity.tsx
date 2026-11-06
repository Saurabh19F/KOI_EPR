'use client';

import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { reportsApi } from '@/lib/api';

type Month = { date: string; count: number; won: number; lost: number };
const axis = { fill: '#475569', fontSize: 12 };

export function SalesActivity() {
  const query = useQuery({ queryKey: ['dashboard-sales-activity'], meta: { dashboardOverview: true }, queryFn: () => reportsApi.getSalesSummary() });
  const months: Month[] = Array.isArray(query.data?.data?.byMonth) ? query.data.data.byMonth.slice(-6) : [];
  const mix = [{ name: 'Won', value: 0, color: '#008947' }, { name: 'Lost', value: 0, color: '#b90f1c' }, { name: 'Other', value: 0, color: '#9b9600' }];
  for (const month of months) {
    mix[0].value += Number(month.won);
    mix[1].value += Number(month.lost);
    mix[2].value += Math.max(0, Number(month.count) - Number(month.won) - Number(month.lost));
  }
  const total = mix.reduce((sum, item) => sum + item.value, 0);
  if (!total) {
    return (
      <section className="erp-glass-panel sales-activity-empty" aria-label="Sales activity">
        <div className="erp-chart-heading"><h2>Sales activity</h2></div>
        <p role="status">{query.isLoading ? 'Loading enquiries…' : query.isError ? 'Sales activity is unavailable.' : 'No enquiries in this period.'}</p>
        {query.isError && <button type="button" disabled={query.isFetching} onClick={() => query.refetch()}>
          {query.isFetching ? 'Retrying…' : 'Retry'}
        </button>}
      </section>
    );
  }
  return (
    <section className="erp-analytics" aria-label="Sales activity">
      <div className="erp-glass-panel">
        <div className="erp-chart-heading"><h2>Enquiry trend</h2><span>Latest reported months</span></div>
        <div className="erp-plot"><ResponsiveContainer width="100%" height="100%">
          <AreaChart data={months} margin={{ left: -22, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} stroke="#dbe3ed" strokeDasharray="3 3"/><XAxis dataKey="date" tick={axis} tickLine={false}/><YAxis allowDecimals={false} tick={axis} tickLine={false}/><Tooltip/>
            <Area dataKey="count" name="Enquiries" type="linear" fill="#ede9fe" stroke="#3e2e9b" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false}/>
          </AreaChart>
        </ResponsiveContainer></div>
      </div>
      <div className="erp-glass-panel erp-mix">
        <div className="erp-chart-heading"><h2>Enquiry outcomes</h2></div>
          <div className="erp-plot"><ResponsiveContainer width="100%" height="100%"><PieChart>
            <Pie stroke="#fcfeff" data={mix} dataKey="value" nameKey="name" innerRadius="54%" outerRadius="80%" isAnimationActive={false}>{mix.map(item=><Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
          <ul>{mix.map(item=><li key={item.name}><span style={{ background: item.color }}/>{item.name}<strong>{item.value.toLocaleString()}</strong></li>)}</ul>
      </div>
      <div className="erp-glass-panel">
        <div className="erp-chart-heading"><h2>Monthly outcomes</h2><span>Won / Lost</span></div>
        <div className="erp-plot"><ResponsiveContainer width="100%" height="100%"><BarChart data={months} margin={{left:-22,right:12,top:8}}><CartesianGrid vertical={false} stroke="#dbe3ed" strokeDasharray="3 3"/><XAxis dataKey="date" tick={axis} tickLine={false}/><YAxis tick={axis} tickLine={false} allowDecimals={false}/><Tooltip/><Bar name="Won" dataKey="won" fill={mix[0].color} maxBarSize={26} isAnimationActive={false}/><Bar name="Lost" dataKey="lost" fill={mix[1].color} maxBarSize={26} isAnimationActive={false}/></BarChart></ResponsiveContainer></div>
      </div>
    </section>
  );
}
