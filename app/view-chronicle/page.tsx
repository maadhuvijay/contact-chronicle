'use client';

import { useState, useMemo } from 'react';

interface Contact {
  id: string;
  name: string;
  company: string;
  role: string;
  dateAdded: string;
  source: string;
  notes: string;
}

// Mock data for demonstration
const mockContacts: Contact[] = [
  { id: '1', name: 'John Doe', company: 'IBM', role: 'Software Engineer', dateAdded: '2022-11-15', source: 'LinkedIn', notes: '' },
  { id: '2', name: 'Jane Smith', company: 'Google', role: 'Product Manager', dateAdded: '2022-11-20', source: 'LinkedIn', notes: '' },
  { id: '3', name: 'Bob Johnson', company: 'Microsoft', role: 'Designer', dateAdded: '2022-10-05', source: 'Google', notes: '' },
  { id: '4', name: 'Alice Williams', company: 'Apple', role: 'Developer', dateAdded: '2023-01-10', source: 'LinkedIn', notes: '' },
  { id: '5', name: 'Charlie Brown', company: 'Amazon', role: 'Manager', dateAdded: '2023-02-15', source: 'Google', notes: '' },
];

// Mock monthly data for last 5 years
const mockMonthlyData = [
  { month: '10-20', count: 45 },
  { month: '11-20', count: 62 },
  { month: '12-20', count: 38 },
  { month: '01-21', count: 55 },
  { month: '02-21', count: 48 },
  { month: '03-21', count: 71 },
  { month: '04-21', count: 52 },
  { month: '05-21', count: 59 },
  { month: '06-21', count: 43 },
  { month: '07-21', count: 67 },
  { month: '08-21', count: 51 },
  { month: '09-21', count: 58 },
  { month: '10-21', count: 64 },
  { month: '11-21', count: 89 },
  { month: '12-21', count: 42 },
  { month: '01-22', count: 56 },
  { month: '02-22', count: 49 },
  { month: '03-22', count: 73 },
  { month: '04-22', count: 54 },
  { month: '05-22', count: 61 },
  { month: '06-22', count: 46 },
  { month: '07-22', count: 69 },
  { month: '08-22', count: 53 },
  { month: '09-22', count: 60 },
  { month: '10-22', count: 66 },
  { month: '11-22', count: 188 },
  { month: '12-22', count: 44 },
  { month: '01-23', count: 57 },
  { month: '02-23', count: 50 },
  { month: '03-23', count: 74 },
  { month: '04-23', count: 55 },
  { month: '05-23', count: 62 },
  { month: '06-23', count: 47 },
  { month: '07-23', count: 70 },
  { month: '08-23', count: 54 },
  { month: '09-23', count: 61 },
  { month: '10-23', count: 68 },
  { month: '11-23', count: 92 },
  { month: '12-23', count: 45 },
  { month: '01-24', count: 58 },
  { month: '02-24', count: 51 },
  { month: '03-24', count: 75 },
  { month: '04-24', count: 56 },
  { month: '05-24', count: 63 },
  { month: '06-24', count: 48 },
  { month: '07-24', count: 72 },
  { month: '08-24', count: 55 },
  { month: '09-24', count: 62 },
  { month: '10-24', count: 69 },
  { month: '11-24', count: 95 },
  { month: '12-24', count: 46 },
  { month: '01-25', count: 59 },
  { month: '02-25', count: 52 },
  { month: '03-25', count: 76 },
  { month: '04-25', count: 57 },
  { month: '05-25', count: 64 },
  { month: '06-25', count: 49 },
  { month: '07-25', count: 73 },
  { month: '08-25', count: 56 },
];

export default function ViewChroniclePage() {
  const [contacts] = useState<Contact[]>(mockContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [eventType, setEventType] = useState('All');
  const [source, setSource] = useState('All');

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalContacts = mockMonthlyData.reduce((sum, item) => sum + item.count, 0);
    const avgPerMonth = totalContacts / mockMonthlyData.length;
    const peakMonth = mockMonthlyData.reduce((max, item) => 
      item.count > max.count ? item : max, mockMonthlyData[0]
    );
    const meanVolume = avgPerMonth;
    const highActivityMonths = mockMonthlyData.filter(item => item.count > meanVolume).length;
    const highActivityPercent = Math.round((highActivityMonths / mockMonthlyData.length) * 100);

    return {
      totalContacts,
      avgPerMonth: avgPerMonth.toFixed(1),
      peakMonth: `${peakMonth.month} (${peakMonth.count})`,
      highActivityPercent,
    };
  }, []);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = source === 'All' || contact.source === source;
      // Date filtering would go here when implemented
      return matchesSearch && matchesSource;
    });
  }, [contacts, searchQuery, source]);

  const maxCount = Math.max(...mockMonthlyData.map(d => d.count));

  const updateNote = (contactId: string, note: string) => {
    setNotes({ ...notes, [contactId]: note });
  };

  const exportToCSV = () => {
    // CSV headers
    const headers = ['Name', 'Company', 'Role', 'Date Added', 'Source', 'Notes'];
    
    // Convert contacts to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...filteredContacts.map((contact) => {
        const row = [
          `"${contact.name.replace(/"/g, '""')}"`,
          `"${contact.company.replace(/"/g, '""')}"`,
          `"${contact.role.replace(/"/g, '""')}"`,
          `"${contact.dateAdded.replace(/"/g, '""')}"`,
          `"${contact.source.replace(/"/g, '""')}"`,
          `"${(notes[contact.id] || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        ];
        return row.join(',');
      }),
    ];

    // Create CSV content
    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#305669] mb-2">
          View Chronicle
        </h1>
      </div>

      {/* Connections Dashboard */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Connections Dashboard</h2>
          <span className="text-xs text-gray-400">Last 5 Years</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Contacts</h3>
            </div>
            <p className="text-3xl font-bold text-[#305669]">{metrics.totalContacts.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Sum across all months</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg / Month</h3>
            </div>
            <p className="text-3xl font-bold text-[#305669]">{metrics.avgPerMonth}</p>
            <p className="text-xs text-gray-500 mt-1">Mean contacts per month</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-600">Peak Month</h3>
            </div>
            <p className="text-3xl font-bold text-[#305669]">{metrics.peakMonth.split(' ')[0]}</p>
            <p className="text-xs text-gray-500 mt-1">{metrics.peakMonth.split('(')[1]?.replace(')', '')} contacts</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-600">High-Activity Months</h3>
            </div>
            <p className="text-3xl font-bold text-[#305669]">{metrics.highActivityPercent}%</p>
            <p className="text-xs text-gray-500 mt-1">&gt; median monthly volume</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-[#305669] mb-4">
          Contacts Added by Month (Last 5 Years)
        </h2>
        <div className="overflow-x-auto">
          <div className="flex items-end space-x-1 h-64 pb-8 border-b border-gray-200">
            {mockMonthlyData.map((item, index) => {
              const height = (item.count / maxCount) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-1 min-w-[20px]">
                  <div
                    className="w-full bg-[#C1785A] rounded-t hover:bg-[#b06a4a] transition-colors cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`${item.month}: ${item.count} contacts`}
                  />
                  {index % 6 === 0 && (
                    <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                      {item.month}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">X-axis: Month (MM-YY)</p>
            <p className="text-sm text-gray-600">Y-axis: Number of Contacts Added</p>
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">
            Bars show monthly additions; cycles indicate bursts vs. lulls.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Filter Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#305669] mb-4">
              Filter Panel
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9]"
                  />
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9]"
                >
                  <option>All</option>
                  <option>Professional</option>
                  <option>Personal</option>
                  <option>Geographic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9]"
                >
                  <option>All</option>
                  <option>LinkedIn</option>
                  <option>Google</option>
                  <option>Facebook</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#305669]">
                Contacts
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9] w-64"
                />
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-[#8ABEB9] text-white rounded-md hover:bg-[#7aada8] transition-colors font-semibold text-sm whitespace-nowrap"
                >
                  Export CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#456882]">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Company</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Date Added</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Source</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm border border-[#456882]">{contact.name}</td>
                      <td className="py-3 px-4 text-sm border border-[#456882]">{contact.company}</td>
                      <td className="py-3 px-4 text-sm border border-[#456882]">{contact.role}</td>
                      <td className="py-3 px-4 text-sm border border-[#456882]">{contact.dateAdded}</td>
                      <td className="py-3 px-4 text-sm border border-[#456882]">{contact.source}</td>
                      <td className="py-3 px-4 border border-[#456882]">
                        <textarea
                          value={notes[contact.id] || ''}
                          onChange={(e) => updateNote(contact.id, e.target.value)}
                          placeholder="Add note..."
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#8ABEB9] resize-none"
                          rows={2}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredContacts.length === 0 && (
                <p className="text-center text-gray-500 py-8">No contacts found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

