'use client';

import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/Toast';
import ContactsBarChart from '@/components/ContactsBarChart';
import { MonthlyData } from '@/types';
import { formatDateToMMYY, formatDateObjectToMMYY, formatDateToFull } from '@/lib/dateUtils';

// Prevent static generation since this page uses Supabase
export const dynamic = 'force-dynamic';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
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

interface TimelineEvent {
  id: string;
  monthYear: string;
  event: string;
  eventType: 'Professional' | 'Personal' | 'Geographic';
  rowId: string; // Store the original row ID to fetch full date info if needed
}

interface DatabaseTimelineRow {
  id: string;
  month_year: string | null;
  professional_event: string | null;
  personal_event: string | null;
  geographic_event: string | null;
  created_at?: string;
  updated_at?: string;
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
  const [eventType, setEventType] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState('All');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
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
            email: dbContact.email || '',
            phone: dbContact.phone || '',
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

  // Fetch timeline events from Supabase
  useEffect(() => {
    const fetchTimelineEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('timeline_rows')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching timeline events:', error);
          return;
        }

        if (data) {
          // Transform timeline rows into events array
          const events: TimelineEvent[] = [];
          data.forEach((row: DatabaseTimelineRow) => {
            if (row.professional_event && row.professional_event.trim()) {
              events.push({
                id: `${row.id}-professional`,
                monthYear: row.month_year || '',
                event: row.professional_event,
                eventType: 'Professional',
                rowId: row.id,
              });
            }
            if (row.personal_event && row.personal_event.trim()) {
              events.push({
                id: `${row.id}-personal`,
                monthYear: row.month_year || '',
                event: row.personal_event,
                eventType: 'Personal',
                rowId: row.id,
              });
            }
            if (row.geographic_event && row.geographic_event.trim()) {
              events.push({
                id: `${row.id}-geographic`,
                monthYear: row.month_year || '',
                event: row.geographic_event,
                eventType: 'Geographic',
                rowId: row.id,
              });
            }
          });
          setTimelineEvents(events);
        }
      } catch (error) {
        console.error('Error fetching timeline events:', error);
      }
    };

    fetchTimelineEvents();
  }, []);

  // Filter events based on selected event type
  const filteredEvents = useMemo(() => {
    if (eventType === 'All') {
      return timelineEvents;
    }
    return timelineEvents.filter((event) => event.eventType === eventType);
  }, [timelineEvents, eventType]);

  // Helper function to format monthYear string to MM-YY format for display
  const formatMonthYearToMMYY = (monthYear: string): string => {
    if (!monthYear || !monthYear.trim()) {
      return '';
    }
    
    // If already in MM-YY format, return as-is
    const trimmed = monthYear.trim();
    const mmYyMatch = trimmed.match(/^(\d{2})-(\d{2})$/);
    if (mmYyMatch) {
      return trimmed;
    }
    
    // Try to parse and format
    const dateString = parseMonthYearToDate(monthYear);
    if (dateString) {
      return formatDateToMMYY(dateString);
    }
    
    // If parsing fails, try to parse directly as date
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      return formatDateObjectToMMYY(parsedDate);
    }
    
    // If all else fails, return original
    return trimmed;
  };

  // Helper function to parse month_year string to date
  const parseMonthYearToDate = (monthYear: string): string => {
    if (!monthYear || !monthYear.trim()) {
      return '';
    }
    
    const trimmed = monthYear.trim();
    
    // Try MM-YY format (e.g., "01-24" for January 2024, "05-06" for May 2006)
    const mmYyMatch = trimmed.match(/^(\d{2})-(\d{2})$/);
    if (mmYyMatch) {
      const month = parseInt(mmYyMatch[1], 10); // First group is month
      const year = parseInt(mmYyMatch[2], 10);   // Second group is year
      // Assume 20XX for 2-digit years (e.g., 06 -> 2006, 24 -> 2024)
      const fullYear = year < 100 ? 2000 + year : year;
      if (month >= 1 && month <= 12) {
        // Return in YYYY-MM-DD format with day = 01
        return `${fullYear}-${String(month).padStart(2, '0')}-01`;
      }
    }
    
    // Try MM/YY format (e.g., "01/24")
    const mmYySlashMatch = trimmed.match(/^(\d{2})\/(\d{2})$/);
    if (mmYySlashMatch) {
      const month = parseInt(mmYySlashMatch[1], 10);
      const year = parseInt(mmYySlashMatch[2], 10);
      const fullYear = year < 100 ? 2000 + year : year;
      if (month >= 1 && month <= 12) {
        return `${fullYear}-${String(month).padStart(2, '0')}-01`;
      }
    }
    
    // Try MM/YYYY format (e.g., "08/2006")
    const mmYyyySlashMatch = trimmed.match(/^(\d{2})\/(\d{4})$/);
    if (mmYyyySlashMatch) {
      const month = parseInt(mmYyyySlashMatch[1], 10);
      const year = parseInt(mmYyyySlashMatch[2], 10);
      if (month >= 1 && month <= 12) {
        return `${year}-${String(month).padStart(2, '0')}-01`;
      }
    }
    
    // Try YYYY-MM format (e.g., "2024-01")
    const yyyyMmMatch = trimmed.match(/^(\d{4})-(\d{2})$/);
    if (yyyyMmMatch) {
      const year = parseInt(yyyyMmMatch[1], 10);
      const month = parseInt(yyyyMmMatch[2], 10);
      if (month >= 1 && month <= 12) {
        return `${year}-${String(month).padStart(2, '0')}-01`;
      }
    }
    
    // Try MM-YYYY format (e.g., "01-2024")
    const mmYyyyMatch = trimmed.match(/^(\d{2})-(\d{4})$/);
    if (mmYyyyMatch) {
      const month = parseInt(mmYyyyMatch[1], 10);
      const year = parseInt(mmYyyyMatch[2], 10);
      if (month >= 1 && month <= 12) {
        return `${year}-${String(month).padStart(2, '0')}-01`;
      }
    }
    
    // If no format matches, try to parse as a date string
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = parsedDate.getMonth() + 1;
      return `${year}-${String(month).padStart(2, '0')}-01`;
    }
    
    return '';
  };


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
      ? formatDateObjectToMMYY(peakMonth.fullDate)
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
      ? formatDateObjectToMMYY(highActivityMonth.fullDate)
      : 'N/A';

    return {
      totalContacts,
      avgPerMonth,
      peakMonth: peakMonthFormatted,
      highActivityMonth: highActivityMonthFormatted,
    };
  }, [contacts, monthlyData]);

  // Check if any filters are active - contacts only show when an event is selected
  const hasActiveFilters = useMemo(() => {
    // Require a specific event to be selected
    return selectedEvent !== 'All';
  }, [selectedEvent]);

  // Filter contacts - only show if an event is selected
  const filteredContacts = useMemo(() => {
    // If no event is selected, return empty array
    if (selectedEvent === 'All') {
      return [];
    }

    return contacts.filter((contact) => {
      const matchesSearch = searchQuery.trim() === '' || contact.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = source === 'All' || contact.source === source;
      
      // Date range filtering - filter contacts based on Date Range Start and Date Range End
      let matchesDateRange = true;
      
      // Parse contact date
      const contactDate = new Date(contact.dateAdded);
      if (isNaN(contactDate.getTime())) {
        // If contact date is invalid, exclude it from date range filtering
        matchesDateRange = false;
      } else {
        // Normalize contact date to start of day for comparison
        const contactDateNormalized = new Date(contactDate);
        contactDateNormalized.setHours(0, 0, 0, 0);
        
        // Check Date Range Start
        if (dateRangeStart) {
          const startDate = new Date(dateRangeStart);
          startDate.setHours(0, 0, 0, 0);
          // Contact date must be >= start date
          if (contactDateNormalized < startDate) {
            matchesDateRange = false;
          }
        }
        
        // Check Date Range End
        if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd);
          endDate.setHours(23, 59, 59, 999);
          // Contact date must be <= end date
          if (contactDateNormalized > endDate) {
            matchesDateRange = false;
          }
        }
      }
      
      return matchesSearch && matchesSource && matchesDateRange;
    });
  }, [contacts, searchQuery, source, dateRangeStart, dateRangeEnd, selectedEvent]);

  const updateNote = (contactId: string, note: string) => {
    setNotes({ ...notes, [contactId]: note });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setDateRangeStart('');
    setDateRangeEnd('');
    setSource('All');
    setEventType('All');
    setSelectedEvent('All');
    setNotes({});
  };

  const exportToCSV = () => {
    // CSV headers
    const headers = ['Name', 'Email', 'Phone', 'Date Added', 'Source', 'Notes'];
    
    // Convert contacts to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...filteredContacts.map((contact) => {
        const row = [
          `"${contact.name.replace(/"/g, '""')}"`,
          `"${contact.email.replace(/"/g, '""')}"`,
          `"${contact.phone.replace(/"/g, '""')}"`,
          `"${formatDateToFull(contact.dateAdded).replace(/"/g, '""')}"`,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#305669] mb-1">
          View Chronicle
        </h1>
      </div>

      {/* Connections Dashboard */}
      <div className="bg-[#16476A] rounded-lg p-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-white">Connections Dashboard</h2>
          <span className="text-xs text-gray-400">Last 5 Years</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="mb-1">
              <h3 className="text-sm font-medium text-gray-600">Total Contacts</h3>
            </div>
            {isLoading ? (
              <p className="text-2xl font-bold text-[#305669]">...</p>
            ) : (
              <p className="text-2xl font-bold text-[#305669]">{metrics.totalContacts.toLocaleString()}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Total unique entries</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="mb-1">
              <h3 className="text-sm font-medium text-gray-600">Avg / Month</h3>
            </div>
            {isLoading ? (
              <p className="text-2xl font-bold text-[#305669]">...</p>
            ) : (
              <p className="text-2xl font-bold text-[#305669]">{metrics.avgPerMonth}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Average contacts per month</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="mb-1">
              <h3 className="text-sm font-medium text-gray-600">Peak Month</h3>
            </div>
            {isLoading ? (
              <p className="text-2xl font-bold text-[#305669]">...</p>
            ) : (
              <p className="text-2xl font-bold text-[#305669]">{metrics.peakMonth}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Month with highest contacts</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="mb-1">
              <h3 className="text-sm font-medium text-gray-600">High Activity Month</h3>
            </div>
            {isLoading ? (
              <p className="text-2xl font-bold text-[#305669]">...</p>
            ) : (
              <p className="text-2xl font-bold text-[#305669]">{metrics.highActivityMonth}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Median monthly volume</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mb-5">
        <ContactsBarChart data={monthlyData} isLoading={isLoading} />
      </div>

      {/* Filter Panel */}
      <div className="mb-4">
        <div className="bg-[#16476A] rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-white">
              Filter Panel
            </h2>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-[#FAEAB1] text-gray-700 rounded-md hover:bg-[#f5e09a] transition-colors font-semibold text-sm whitespace-nowrap"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value);
                  setSelectedEvent('All'); // Reset event selection when type changes
                }}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9]"
              >
                <option>All</option>
                <option>Professional</option>
                <option>Personal</option>
                <option>Geographic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Events
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9]"
                disabled={eventType === 'All'}
              >
                <option>All</option>
                {filteredEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.monthYear ? `${formatMonthYearToMMYY(event.monthYear)}: ` : ''}{event.event}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Date Range Start
              </label>
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Date Range End
              </label>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9]"
              >
                <option>All</option>
                <option>LinkedIn</option>
                <option>Google</option>
                <option>Facebook</option>
                <option>Twitter</option>
                <option>Instagram</option>
                <option>Email</option>
                <option>Phone</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Contacts Table Section */}
          <div className="mt-4 pt-4 border-t border-gray-400">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-white">
                Contacts
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9] w-64"
                />
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-[#FAEAB1] text-gray-700 rounded-md hover:bg-[#f5e09a] transition-colors font-semibold text-sm whitespace-nowrap"
                >
                  Export CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full bg-white border-collapse border border-[#456882]">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Date Added</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Source</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-500 py-8">
                        {selectedEvent !== 'All' ? 'No contacts found matching your filters' : 'Select an event to view contacts'}
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm border border-[#456882]">{contact.name}</td>
                        <td className="py-3 px-4 text-sm border border-[#456882]">{contact.email || '-'}</td>
                        <td className="py-3 px-4 text-sm border border-[#456882]">{contact.phone || '-'}</td>
                        <td className="py-3 px-4 text-sm border border-[#456882]">{formatDateToFull(contact.dateAdded)}</td>
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
                    ))
                  )}
                </tbody>
              </table>
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

