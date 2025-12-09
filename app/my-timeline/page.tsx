'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseConfigError } from '@/lib/supabase';
import Toast from '@/components/Toast';
import VerticalTimeline, { TimelineEvent } from '@/components/VerticalTimeline';

// Prevent static generation since this page uses Supabase
export const dynamic = 'force-dynamic';

interface TimelineRow {
  id: string;
  monthYear: string;
  professionalEvent: string;
  personalEvent: string;
  geographicEvent: string;
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

export default function MyTimelinePage() {
  const [timelineRows, setTimelineRows] = useState<TimelineRow[]>([
    { id: '1', monthYear: '', professionalEvent: '', personalEvent: '', geographicEvent: '' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [showTimelineView, setShowTimelineView] = useState(false);
  const [savedTimelineRows, setSavedTimelineRows] = useState<TimelineRow[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [hasSavedEntries, setHasSavedEntries] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [editMonth, setEditMonth] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editEventText, setEditEventText] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const addRow = () => {
    const newRow: TimelineRow = {
      id: Date.now().toString(),
      monthYear: '',
      professionalEvent: '',
      personalEvent: '',
      geographicEvent: '',
    };
    setTimelineRows([...timelineRows, newRow]);
  };

  const deleteRow = (id: string) => {
    if (timelineRows.length > 1) {
      setTimelineRows(timelineRows.filter((row) => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof TimelineRow, value: string) => {
    setTimelineRows(
      timelineRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  // Check if at least one row has data
  const hasRowsWithData = () => {
    return timelineRows.some((row) => 
      row.monthYear.trim() || 
      row.professionalEvent.trim() || 
      row.personalEvent.trim() || 
      row.geographicEvent.trim()
    );
  };

  // Get rows with data for timeline display
  const getRowsWithData = () => {
    return timelineRows.filter((row) => 
      row.monthYear.trim() || 
      row.professionalEvent.trim() || 
      row.personalEvent.trim() || 
      row.geographicEvent.trim()
    );
  };

  // Check if there are saved entries in the database
  const checkForSavedEntries = async () => {
    if (!isSupabaseConfigured()) {
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('timeline_rows')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Error checking for saved entries:', error);
        return;
      }

      setHasSavedEntries(data && data.length > 0);
    } catch (err) {
      console.error('Unexpected error checking for saved entries:', err);
    }
  };

  // Parse month_year string to a sortable date
  const parseMonthYear = (monthYear: string): Date => {
    if (!monthYear || !monthYear.trim()) {
      // Return a far future date for invalid/empty dates so they appear at the end
      return new Date('9999-12-31');
    }
    
    const trimmed = monthYear.trim();
    const parts = trimmed.split('/');
    
    // Handle MM/YYYY format
    if (parts.length === 2) {
      const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed in Date
      const year = parseInt(parts[1], 10);
      if (!isNaN(month) && !isNaN(year) && month >= 0 && month < 12) {
        return new Date(year, month, 1);
      }
    }
    
    // Handle YYYY format
    if (parts.length === 1 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      if (!isNaN(year)) {
        return new Date(year, 0, 1); // January 1st of that year
      }
    }
    
    // If parsing fails, return far future date
    return new Date('9999-12-31');
  };

  // Fetch all timeline rows from Supabase
  const fetchTimelineRows = async () => {
    if (!isSupabaseConfigured()) {
      setIsLoadingTimeline(false);
      alert(getSupabaseConfigError() || 'Supabase is not configured. Please contact the administrator.');
      return;
    }
    
    setIsLoadingTimeline(true);
    try {
      const { data, error } = await supabase
        .from('timeline_rows')
        .select('*');

      if (error) {
        console.error('Error fetching timeline rows:', error);
        alert(`Failed to load timeline: ${error.message || 'Unknown error'}`);
        setIsLoadingTimeline(false);
        return;
      }

      // Convert database format to component format
      const convertedRows: TimelineRow[] = (data || []).map((row: DatabaseTimelineRow) => ({
        id: row.id,
        monthYear: row.month_year || '',
        professionalEvent: row.professional_event || '',
        personalEvent: row.personal_event || '',
        geographicEvent: row.geographic_event || '',
      }));

      // Sort chronologically by month_year
      const sortedRows = convertedRows.sort((a, b) => {
        const dateA = parseMonthYear(a.monthYear);
        const dateB = parseMonthYear(b.monthYear);
        return dateA.getTime() - dateB.getTime();
      });

      setSavedTimelineRows(sortedRows);
    } catch (err) {
      console.error('Unexpected error fetching timeline rows:', err);
      alert(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  // Handle view timeline button click
  const handleViewTimeline = async () => {
    if (!showTimelineView) {
      // Opening the view - fetch data from Supabase
      await fetchTimelineRows();
    }
    setShowTimelineView(!showTimelineView);
  };

  // Handle edit event
  const handleEditEvent = (event: TimelineEvent) => {
    setEditingEvent(event);
    setEditMonth(String(event.month).padStart(2, '0'));
    setEditYear(String(event.year));
    setEditEventText(event.eventDescription);
  };

  // Handle save edited event
  const handleSaveEdit = async () => {
    if (!editingEvent || !editingEvent.rowId) {
      return;
    }

    // Validate inputs
    const monthNum = parseInt(editMonth);
    const yearNum = parseInt(editYear);
    
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      alert('Please enter a valid month (1-12)');
      return;
    }

    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      alert('Please enter a valid year');
      return;
    }

    if (!editEventText.trim()) {
      alert('Please enter event text');
      return;
    }

    if (!isSupabaseConfigured()) {
      alert(getSupabaseConfigError() || 'Supabase is not configured. Please contact the administrator.');
      return;
    }

    try {
      // Get the current row from database
      const { data: currentRow, error: fetchError } = await supabase
        .from('timeline_rows')
        .select('*')
        .eq('id', editingEvent.rowId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!currentRow) {
        throw new Error('Row not found');
      }

      // Prepare update data
      const monthYear = `${editMonth}/${editYear}`;
      const updateData: Partial<DatabaseTimelineRow> = {
        month_year: monthYear,
      };

      // Update the specific event field based on event type
      if (editingEvent.eventType === 'Professional') {
        updateData.professional_event = editEventText.trim() || null;
      } else if (editingEvent.eventType === 'Personal') {
        updateData.personal_event = editEventText.trim() || null;
      } else if (editingEvent.eventType === 'Geographic') {
        updateData.geographic_event = editEventText.trim() || null;
      }

      // Update the row in database
      const { error: updateError } = await supabase
        .from('timeline_rows')
        .update(updateData)
        .eq('id', editingEvent.rowId);

      if (updateError) {
        throw updateError;
      }

      // Refresh timeline data
      await fetchTimelineRows();
      setEditingEvent(null);
      setEditMonth('');
      setEditYear('');
      setEditEventText('');
      setToastMessage('Event updated successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error updating event:', error);
      alert(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (event: TimelineEvent) => {
    if (!event.rowId) {
      return;
    }

    if (!isSupabaseConfigured()) {
      alert(getSupabaseConfigError() || 'Supabase is not configured. Please contact the administrator.');
      return;
    }

    try {
      // Get the current row from database
      const { data: currentRow, error: fetchError } = await supabase
        .from('timeline_rows')
        .select('*')
        .eq('id', event.rowId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!currentRow) {
        throw new Error('Row not found');
      }

      // Determine which field to clear based on event type
      const updateData: Partial<DatabaseTimelineRow> = {};

      if (event.eventType === 'Professional') {
        updateData.professional_event = null;
      } else if (event.eventType === 'Personal') {
        updateData.personal_event = null;
      } else if (event.eventType === 'Geographic') {
        updateData.geographic_event = null;
      }

      // Check if all event fields are empty or will be empty after this deletion
      const willBeEmpty = 
        (event.eventType === 'Professional' || !currentRow.professional_event) &&
        (event.eventType === 'Personal' || !currentRow.personal_event) &&
        (event.eventType === 'Geographic' || !currentRow.geographic_event);

      if (willBeEmpty) {
        // Delete the entire row if no events remain
        const { error: deleteError } = await supabase
          .from('timeline_rows')
          .delete()
          .eq('id', event.rowId);

        if (deleteError) {
          throw deleteError;
        }
      } else {
        // Just clear the specific event field
        const { error: updateError } = await supabase
          .from('timeline_rows')
          .update(updateData)
          .eq('id', event.rowId);

        if (updateError) {
          throw updateError;
        }
      }

      // Refresh timeline data
      await fetchTimelineRows();
      setToastMessage('Event deleted successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Initialize page with single empty row and check for saved entries
  useEffect(() => {
    // Always start with one empty row for new entries
    setIsLoading(false);
    // Check if there are any saved entries in the database
    checkForSavedEntries();
  }, []);

  const handleConfirm = async () => {
    // Check if Supabase is configured before proceeding
    if (!isSupabaseConfigured()) {
      const errorMsg = getSupabaseConfigError();
      alert(errorMsg || 'Supabase is not configured. Please contact the administrator.');
      return;
    }

    try {
      // Prepare data for insertion
      // Filter out completely empty rows (rows where all fields are empty)
      const rowsToInsert = timelineRows
        .filter((row) => {
          // Keep rows that have at least one field filled
          return row.monthYear.trim() || 
                 row.professionalEvent.trim() || 
                 row.personalEvent.trim() || 
                 row.geographicEvent.trim();
        })
        .map((row) => {
          // Convert empty strings to null for better database handling
          // This matches the database schema where fields can be null
          return {
            month_year: row.monthYear.trim() || null,
            professional_event: row.professionalEvent.trim() || null,
            personal_event: row.personalEvent.trim() || null,
            geographic_event: row.geographicEvent.trim() || null,
          };
        });

      // If no valid rows to insert, show message and return
      if (rowsToInsert.length === 0) {
        alert('Please fill in at least one field in at least one row before saving.');
        return;
      }

      console.log('Inserting timeline rows:', rowsToInsert);

      // Insert all rows into Supabase
      const { data, error } = await supabase
        .from('timeline_rows')
        .insert(rowsToInsert)
        .select();

      if (error) {
        console.error('Error saving timeline rows:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          error: error
        });
        alert(`Failed to save timeline: ${error.message || 'Unknown error'}. Please check your Supabase configuration.`);
        return;
      }

      console.log('Successfully saved timeline rows:', data);

      // After successful save, clear rows and keep only one empty row
      setTimelineRows([
        { id: Date.now().toString(), monthYear: '', professionalEvent: '', personalEvent: '', geographicEvent: '' },
      ]);

      // Show success toast
      setShowToast(true);
      
      // Update saved entries check and refresh timeline if it's open
      await checkForSavedEntries();
      if (showTimelineView) {
        await fetchTimelineRows();
      }
    } catch (err) {
      console.error('Unexpected error saving timeline:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      alert(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toast
        message={toastMessage || "Timeline saved"}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#305669] mb-2">
          Build Your Personal Timeline
        </h1>
        <p className="text-gray-600">
          Add key professional, personal, and geographic milestones across your life and career.
        </p>
      </div>

      <div className="bg-[#16476A] rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left py-3 px-4 font-semibold text-white">Month / Year</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Key Professional Event</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Key Personal Event</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Key Geographic Event</th>
                <th className="text-left py-3 px-4 font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timelineRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-400 hover:bg-[#1e5a7a]">
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="09-25"
                      value={row.monthYear}
                      onChange={(e) => updateRow(row.id, 'monthYear', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9] focus:border-transparent"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="e.g. Started Work at IBM"
                      value={row.professionalEvent}
                      onChange={(e) => updateRow(row.id, 'professionalEvent', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9] focus:border-transparent"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="e.g. Had a baby"
                      value={row.personalEvent}
                      onChange={(e) => updateRow(row.id, 'personalEvent', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9] focus:border-transparent"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="e.g. Moved to Newark"
                      value={row.geographicEvent}
                      onChange={(e) => updateRow(row.id, 'geographicEvent', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9] focus:border-transparent"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => deleteRow(row.id)}
                      disabled={timelineRows.length === 1}
                      className="px-3 py-1 bg-gray-100 text-red-600 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={addRow}
            className="px-4 py-2 bg-[#BDE8CA] text-gray-700 rounded-md hover:bg-[#a8d4b5] transition-colors"
          >
            Add Row
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-400">
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-[#BDE8CA] text-gray-700 rounded-md hover:bg-[#a8d4b5] transition-colors font-semibold"
            >
              Confirm Timeline
            </button>
            {hasSavedEntries && (
              <button
                onClick={handleViewTimeline}
                disabled={isLoadingTimeline}
                className="px-6 py-3 bg-[#BDE8CA] text-gray-700 rounded-md hover:bg-[#a8d4b5] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingTimeline ? 'Loading...' : showTimelineView ? 'Hide Timeline' : 'View Timeline'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      {showTimelineView && (
        <div className="mt-8 rounded-lg border border-gray-200 shadow-sm bg-white overflow-hidden">
          <div className="p-6">
            {isLoadingTimeline ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#305669]"></div>
                <p className="text-gray-600 mt-4">Loading timeline...</p>
              </div>
            ) : savedTimelineRows.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No timeline entries found. Add some entries and save them to see your timeline.</p>
              </div>
            ) : (
              <TimelineVisualization 
                rows={savedTimelineRows} 
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            )}
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-[#305669] mb-4">Edit Event</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={editMonth}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                    setEditMonth(value);
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value && parseInt(value) >= 1 && parseInt(value) <= 12) {
                    setEditMonth(String(parseInt(value)).padStart(2, '0'));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9]"
                placeholder="01"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                min="1900"
                max="2100"
                value={editYear}
                onChange={(e) => setEditYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9]"
                placeholder="2024"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Text ({editingEvent.eventType})
              </label>
              <textarea
                value={editEventText}
                onChange={(e) => setEditEventText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9] resize-none"
                rows={4}
                placeholder="Enter event description..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setEditMonth('');
                  setEditYear('');
                  setEditEventText('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-[#BDE8CA] text-gray-700 rounded-md hover:bg-[#a8d4b5] transition-colors font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Timeline Visualization Component - Transforms TimelineRow data to VerticalTimeline format
function TimelineVisualization({ 
  rows, 
  onEdit, 
  onDelete 
}: { 
  rows: TimelineRow[];
  onEdit?: (event: TimelineEvent) => void;
  onDelete?: (event: TimelineEvent) => void;
}) {
  // Parse month_year string (MM/YYYY or YYYY format) to extract year and month
  const parseMonthYear = (monthYear: string): { year: number; month: number } | null => {
    if (!monthYear || !monthYear.trim()) {
      return null;
    }

    const trimmed = monthYear.trim();
    const parts = trimmed.split('/');

    // Handle MM/YYYY format
    if (parts.length === 2) {
      const month = parseInt(parts[0], 10);
      const year = parseInt(parts[1], 10);
      if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
        return { year, month };
      }
    }

    // Handle YYYY format (default to January)
    if (parts.length === 1 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      if (!isNaN(year)) {
        return { year, month: 1 };
      }
    }

    return null;
  };

  // Transform TimelineRow data to TimelineEvent format
  const transformToTimelineEvents = (rows: TimelineRow[]): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    rows.forEach((row) => {
      const dateInfo = parseMonthYear(row.monthYear);
      if (!dateInfo) {
        return; // Skip rows with invalid dates
      }

      const { year, month } = dateInfo;

      // Check if row has all three events (for highlight logic)
      const hasAllEvents = !!(
        row.professionalEvent?.trim() &&
        row.personalEvent?.trim() &&
        row.geographicEvent?.trim()
      );

      // Create separate events for each event type that has content
      // Professional Event
      if (row.professionalEvent && row.professionalEvent.trim()) {
        events.push({
          id: `${row.id}-professional`,
          year,
          month,
          eventTitle: 'Professional Event',
          eventDescription: row.professionalEvent.trim(),
          highlight: hasAllEvents, // Highlight if all three events exist
          eventType: 'Professional',
          rowId: row.id,
        });
      }

      // Personal Event
      if (row.personalEvent && row.personalEvent.trim()) {
        events.push({
          id: `${row.id}-personal`,
          year,
          month,
          eventTitle: 'Personal Event',
          eventDescription: row.personalEvent.trim(),
          highlight: false,
          eventType: 'Personal',
          rowId: row.id,
        });
      }

      // Geographic Event
      if (row.geographicEvent && row.geographicEvent.trim()) {
        events.push({
          id: `${row.id}-geographic`,
          year,
          month,
          eventTitle: 'Geographic Event',
          eventDescription: row.geographicEvent.trim(),
          highlight: false,
          eventType: 'Geographic',
          rowId: row.id,
        });
      }
    });

    return events;
  };

  const timelineEvents = transformToTimelineEvents(rows);

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No timeline events to display.</p>
      </div>
    );
  }

  return <VerticalTimeline events={timelineEvents} onEdit={onEdit} onDelete={onDelete} />;
}

