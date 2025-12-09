'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MonthlyData } from '@/types';

interface ContactsBarChartProps {
  data: MonthlyData[];
  isLoading?: boolean;
}

export default function ContactsBarChart({ data, isLoading = false }: ContactsBarChartProps) {
  // Transform data for Recharts
  const chartData = data.map((item) => ({
    month: item.month,
    count: item.count,
    monthKey: item.monthKey,
  }));

  // Custom tooltip component with dark theme
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-1">
            {`${payload[0].payload.month}`}
          </p>
          <p className="text-[#d4a017] text-sm">
            {`Contacts: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format x-axis label
  const formatXAxisLabel = (tickItem: string) => {
    return tickItem;
  };

  if (isLoading) {
    return (
      <div className="bg-[#0f1115] border border-gray-700 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-[#0f1115] border border-gray-700 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f1115] border border-gray-700 rounded-xl p-4 text-white shadow-lg w-full">
      {/* Title */}
      <h2 className="text-lg font-bold text-white text-center mb-1">
        Contacts Added by Month (5 Years)
      </h2>
      
      {/* Subtitle */}
      <p className="text-xs text-gray-300 text-center mb-4">
        Bars show monthly additions, cycles indicate bursts vs. lulls.
      </p>

      {/* Chart */}
      <div className="w-full" style={{ height: '320px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 15,
              right: 20,
              left: 15,
              bottom: 70,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3}
            />
            <XAxis
              dataKey="month"
              angle={-45}
              textAnchor="end"
              height={70}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              label={{ 
                value: 'Month (MM-YY)', 
                position: 'insideBottom', 
                offset: -5,
                style: { textAnchor: 'middle', fill: '#d1d5db', fontSize: 11 }
              }}
              interval={data.length > 60 ? Math.floor(data.length / 12) : 5} // Show approximately 12 labels for large datasets
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              label={{ 
                value: 'Number of Contacts Added', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#d1d5db', fontSize: 11 }
              }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              fill="#d4a017"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

