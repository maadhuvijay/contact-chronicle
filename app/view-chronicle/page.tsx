'use client';

import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/Toast';

interface Contact {
  id: string;
  name: string;
  company: string;
  role: string;
  dateAdded: string;
  source: string;
  notes: string;
}

interface DatabaseContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  date_added: string | null;
  date_edited: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

interface MonthlyData {
  month: string; // Format: MM-YY
  count: number;
  monthKey: string; // Format: YYYY-MM for sorting
  fullDate: Date; // For peak month formatting
}

export default function ViewChroniclePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [source, setSource] = useState('All');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Fetch contacts from Supabase
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching contacts:', error);
          setToastMessage('Error loading contacts');
          setShowToast(true);
          return;
        }

        if (data) {
          // Transform database contacts to UI format
          const transformedContacts: Contact[] = data.map((dbContact: DatabaseContact) => ({
            id: dbContact.id,
            name: `${dbContact.first_name || ''} ${dbContact.last_name || ''}`.trim() || 'Unknown',
            company: '', // Not in database schema
            role: '', // Not in database schema
            dateAdded: dbContact.date_added || dbContact.created_at.split('T')[0],
            source: dbContact.source || 'Unknown',
            notes: '',
          }));

          setContacts(transformedContacts);

          // Calculate monthly data for last 5 years
          const fiveYearsAgo = new Date();
          fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
          fiveYearsAgo.setMonth(0, 1); // Start of January, 5 years ago
          fiveYearsAgo.setHours(0, 0, 0, 0);

          // Group contacts by month
          const monthlyMap = new Map<string, { count: number; date: Date }>();

          data.forEach((contact: DatabaseContact) => {
            // Use date_added if available and valid, otherwise use created_at
            let contactDate: Date;
            if (contact.date_added) {
              const parsedDate = new Date(contact.date_added);
              // Check if date is valid
              if (!isNaN(parsedDate.getTime())) {
                contactDate = parsedDate;
              } else {
                contactDate = new Date(contact.created_at);
              }
            } else {
              contactDate = new Date(contact.created_at);
            }
            
            // Only include contacts from last 5 years
            if (!isNaN(contactDate.getTime()) && contactDate >= fiveYearsAgo) {
              const year = contactDate.getFullYear();
              const month = contactDate.getMonth();
              const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
              
              if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, { count: 0, date: new Date(year, month, 1) });
              }
              const entry = monthlyMap.get(monthKey)!;
              entry.count++;
            }
          });

          // Generate all months for last 5 years (even if no contacts)
          const allMonths: MonthlyData[] = [];
          const currentDate = new Date();
          const startDate = new Date(fiveYearsAgo);
          
          for (let date = new Date(startDate); date <= currentDate; date.setMonth(date.getMonth() + 1)) {
            const year = date.getFullYear();
            const month = date.getMonth();
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            const monthStr = `${String(month + 1).padStart(2, '0')}-${String(year).slice(-2)}`;
            
            const entry = monthlyMap.get(monthKey);
            allMonths.push({
              month: monthStr,
              count: entry ? entry.count : 0,
              monthKey,
              fullDate: new Date(year, month, 1),
            });
          }

          // Sort by monthKey to ensure chronological order
          allMonths.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
          setMonthlyData(allMonths);

          setToastMessage('Contacts loaded successfully');
          setShowToast(true);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setToastMessage('Error loading contacts');
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (monthlyData.length === 0) {
      return {
        totalContacts: 0,
        avgPerMonth: '0.0',
        peakMonth: 'N/A',
        highActivityMonth: 'N/A',
      };
    }

    const totalContacts = contacts.length;
    const monthsWithData = monthlyData.filter(m => m.count > 0);
    const avgPerMonth = monthsWithData.length > 0 
      ? (totalContacts / monthsWithData.length).toFixed(1)
      : '0.0';

    // Find peak month (highest count)
    const peakMonth = monthlyData.reduce((max, item) => 
      item.count > max.count ? item : max, monthlyData[0]
    );
    const peakMonthFormatted = peakMonth.count > 0
      ? `${String(peakMonth.fullDate.getMonth() + 1).padStart(2, '0')}/${peakMonth.fullDate.getFullYear()}`
      : 'N/A';

    // Calculate median monthly volume
    const counts = monthlyData
      .filter(m => m.count > 0)
      .map(m => m.count)
      .sort((a, b) => a - b);
    
    let medianCount = 0;
    if (counts.length > 0) {
      const mid = Math.floor(counts.length / 2);
      medianCount = counts.length % 2 === 0
        ? (counts[mid - 1] + counts[mid]) / 2
        : counts[mid];
    }

    // Find month with median volume (closest to median)
    const highActivityMonth = monthlyData.length > 0 && medianCount > 0
      ? monthlyData.reduce((closest, item) => {
          const closestDiff = Math.abs(closest.count - medianCount);
          const itemDiff = Math.abs(item.count - medianCount);
          return itemDiff < closestDiff ? item : closest;
        }, monthlyData[0])
      : null;
    
    const highActivityMonthFormatted = highActivityMonth && highActivityMonth.count > 0
      ? `${String(highActivityMonth.fullDate.getMonth() + 1).padStart(2, '0')}/${highActivityMonth.fullDate.getFullYear()}`
      : 'N/A';

    return {
      totalContacts,
      avgPerMonth,
      peakMonth: peakMonthFormatted,
      highActivityMonth: highActivityMonthFormatted,
    };
  }, [contacts, monthlyData]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() !== '' || 
           source !== 'All' || 
           dateRangeStart !== '' || 
           dateRangeEnd !== '';
  }, [searchQuery, source, dateRangeStart, dateRangeEnd]);

  // Filter contacts - only show if filters are active
  const filteredContacts = useMemo(() => {
    // If no filters are active, return empty array
    if (!hasActiveFilters) {
      return [];
    }

    return contacts.filter((contact) => {
      const matchesSearch = searchQuery.trim() === '' || contact.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = source === 'All' || contact.source === source;
      
      // Date range filtering
      let matchesDateRange = true;
      if (dateRangeStart || dateRangeEnd) {
        const contactDate = new Date(contact.dateAdded);
        if (dateRangeStart) {
          const startDate = new Date(dateRangeStart);
          startDate.setHours(0, 0, 0, 0);
          if (contactDate < startDate) {
            matchesDateRange = false;
          }
        }
        if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd);
          endDate.setHours(23, 59, 59, 999);
          if (contactDate > endDate) {
            matchesDateRange = false;
          }
        }
      }
      
      return matchesSearch && matchesSource && matchesDateRange;
    });
  }, [contacts, searchQuery, source, dateRangeStart, dateRangeEnd, hasActiveFilters]);

  const maxCount = monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.count), 1) : 1;

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
      <div className="bg-[#16476A] rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Connections Dashboard</h2>
          <span className="text-xs text-gray-400">Last 5 Years</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Contacts</h3>
            </div>
            {isLoading ? (
              <p className="text-3xl font-bold text-[#305669]">...</p>
            ) : (
              <p className="text-3xl font-bold text-[#305669]">{metrics.totalContacts.toLocaleString()}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Total unique entries</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg / Month</h3>
            </div>
            {isLoading ? (
              <p className="text-3xl font-bold text-[#305669]">...</p>
            ) : (
              <p className="text-3xl font-bold text-[#305669]">{metrics.avgPerMonth}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Average contacts per month</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-600">Peak Month</h3>
            </div>
            {isLoading ? (
              <p className="text-3xl font-bold text-[#305669]">...</p>
            ) : (
              <p className="text-3xl font-bold text-[#305669]">{metrics.peakMonth}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Month with highest contacts</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-600">High Activity Month</h3>
            </div>
            {isLoading ? (
              <p className="text-3xl font-bold text-[#305669]">...</p>
            ) : (
              <p className="text-3xl font-bold text-[#305669]">{metrics.highActivityMonth}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Median monthly volume</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-[#305669] mb-4">
          Contacts Added by Month (Last 5 Years)
        </h2>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          ) : monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No data available</p>
            </div>
          ) : (
            <div className="flex items-end space-x-1 h-64 pb-8 border-b border-gray-200">
              {monthlyData.map((item, index) => {
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
          )}
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">X-axis: Month (MM-YY)</p>
            <p className="text-sm text-gray-600">Y-axis: Number of Contacts Added</p>
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">
            Bars show monthly additions; cycles indicate bursts vs. lulls.
          </p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#305669] mb-4">
            Filter Panel
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range Start
              </label>
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range End
              </label>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9]"
              />
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
      <div className="mb-8">
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
                  className="px-4 py-2 bg-[#305669] text-white rounded-md hover:bg-[#244a5a] transition-colors font-semibold text-sm whitespace-nowrap"
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
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    {hasActiveFilters ? 'No contacts found matching your filters' : 'Apply filters to view contacts'}
                  </td>
                </tr>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}

