'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/Toast';

interface TimelineRow {
  id: string;
  monthYear: string;
  professionalEvent: string;
  personalEvent: string;
  geographicEvent: string;
}

export default function MyTimelinePage() {
  const [timelineRows, setTimelineRows] = useState<TimelineRow[]>([
    { id: '1', monthYear: '', professionalEvent: '', personalEvent: '', geographicEvent: '' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

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

  // Load existing timeline rows from database
  useEffect(() => {
    const loadTimelineRows = async () => {
      try {
        const { data, error } = await supabase
          .from('timeline_rows')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          // If table doesn't exist, continue with default empty row
          if (error.code === 'PGRST116') {
            console.log('Table does not exist yet. Will be created on first save.');
          } else {
            // Log error with more details and fallbacks
            console.error('Error loading timeline rows:', {
              message: error.message || 'No error message',
              code: error.code || 'No error code',
              details: error.details || 'No details',
              hint: error.hint || 'No hint',
              fullError: error
            });
          }
        } else if (data && data.length > 0) {
          // Map database rows to TimelineRow format
          const mappedRows: TimelineRow[] = data.map((row) => ({
            id: row.id.toString(),
            monthYear: row.month_year || '',
            professionalEvent: row.professional_event || '',
            personalEvent: row.personal_event || '',
            geographicEvent: row.geographic_event || '',
          }));
          setTimelineRows(mappedRows);
        }
      } catch (err) {
        // Handle unexpected errors with better logging
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const errorStack = err instanceof Error ? err.stack : undefined;
        console.error('Unexpected error loading timeline:', {
          message: errorMessage,
          stack: errorStack,
          error: err
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTimelineRows();
  }, []);

  const handleConfirm = async () => {
    try {
      // First, fetch all existing rows to get their IDs
      const { data: existingRows } = await supabase
        .from('timeline_rows')
        .select('id');

      // Delete all existing rows (for single user, we replace all on each save)
      if (existingRows && existingRows.length > 0) {
        const idsToDelete = existingRows.map((row) => row.id);
        const { error: deleteError } = await supabase
          .from('timeline_rows')
          .delete()
          .in('id', idsToDelete);

        if (deleteError && deleteError.code !== 'PGRST116') {
          console.error('Error deleting existing rows:', {
            message: deleteError.message,
            code: deleteError.code,
            details: deleteError.details,
            hint: deleteError.hint,
            error: deleteError
          });
          // Continue anyway - the insert might still work
        }
      }

      // Prepare data for insertion (exclude the temporary id)
      const rowsToInsert = timelineRows.map((row) => ({
        month_year: row.monthYear,
        professional_event: row.professionalEvent,
        personal_event: row.personalEvent,
        geographic_event: row.geographicEvent,
      }));

      // Insert all rows
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

      // Update local state with database IDs
      if (data) {
        const updatedRows: TimelineRow[] = data.map((row, index) => ({
          id: row.id.toString(),
          monthYear: row.month_year || '',
          professionalEvent: row.professional_event || '',
          personalEvent: row.personal_event || '',
          geographicEvent: row.geographic_event || '',
        }));
        setTimelineRows(updatedRows);
      }

      // Show success toast
      setShowToast(true);
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
        message="Timeline saved"
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

      <div className="bg-white rounded-lg border border-[#896C6C] shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#896C6C]">
                <th className="text-left py-3 px-4 font-semibold text-[#305669]">Month / Year</th>
                <th className="text-left py-3 px-4 font-semibold text-[#305669]">Key Professional Event</th>
                <th className="text-left py-3 px-4 font-semibold text-[#305669]">Key Personal Event</th>
                <th className="text-left py-3 px-4 font-semibold text-[#305669]">Key Geographic Event</th>
                <th className="text-left py-3 px-4 font-semibold text-[#305669]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timelineRows.map((row) => (
                <tr key={row.id} className="border-b border-[#896C6C] hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="09/2025"
                      value={row.monthYear}
                      onChange={(e) => updateRow(row.id, 'monthYear', e.target.value)}
                      className="w-full px-3 py-2 border border-[#896C6C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9] focus:border-transparent"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="e.g. Started Work at IBM"
                      value={row.professionalEvent}
                      onChange={(e) => updateRow(row.id, 'professionalEvent', e.target.value)}
                      className="w-full px-3 py-2 border border-[#896C6C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9] focus:border-transparent"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="e.g. Had a baby"
                      value={row.personalEvent}
                      onChange={(e) => updateRow(row.id, 'personalEvent', e.target.value)}
                      className="w-full px-3 py-2 border border-[#896C6C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9] focus:border-transparent"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="e.g. Moved to Newark"
                      value={row.geographicEvent}
                      onChange={(e) => updateRow(row.id, 'geographicEvent', e.target.value)}
                      className="w-full px-3 py-2 border border-[#896C6C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8ABEB9] focus:border-transparent"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => deleteRow(row.id)}
                      disabled={timelineRows.length === 1}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
            className="px-4 py-2 bg-[#8ABEB9] text-white rounded-md hover:bg-[#7aada8] transition-colors"
          >
            Add Row
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-[#896C6C]">
          <button
            onClick={handleConfirm}
            className="px-6 py-3 bg-[#305669] text-white rounded-md hover:bg-[#244a5a] transition-colors font-semibold"
          >
            Confirm Timeline
          </button>
        </div>
      </div>
    </div>
  );
}

