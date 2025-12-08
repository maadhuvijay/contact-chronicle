'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import VerticalTimeline, { TimelineEvent } from '@/components/VerticalTimeline';

// Prevent static generation since this page uses Supabase
export const dynamic = 'force-dynamic';

interface DatabaseTimelineRow {
  id: string;
  month_year: string | null;
  professional_event: string | null;
  personal_event: string | null;
  geographic_event: string | null;
  created_at?: string;
  updated_at?: string;
}

export default function ViewTimelinePage() {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse month_year string (MM/YYYY or YYYY format) to extract year and month
  const parseMonthYear = (monthYear: string | null): { year: number; month: number } | null => {
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

  // Transform database rows to timeline events
  const transformToTimelineEvents = (rows: DatabaseTimelineRow[]): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    rows.forEach((row) => {
      const dateInfo = parseMonthYear(row.month_year);
      if (!dateInfo) {
        return; // Skip rows with invalid dates
      }

      const { year, month } = dateInfo;

      // Check if row has all three events (for highlight logic)
      const hasAllEvents = !!(
        row.professional_event?.trim() &&
        row.personal_event?.trim() &&
        row.geographic_event?.trim()
      );

      // Create separate events for each event type that has content
      // Professional Event
      if (row.professional_event && row.professional_event.trim()) {
        events.push({
          id: `${row.id}-professional`,
          year,
          month,
          eventTitle: 'Professional Event',
          eventDescription: row.professional_event.trim(),
          highlight: hasAllEvents, // Highlight if all three events exist
        });
      }

      // Personal Event
      if (row.personal_event && row.personal_event.trim()) {
        events.push({
          id: `${row.id}-personal`,
          year,
          month,
          eventTitle: 'Personal Event',
          eventDescription: row.personal_event.trim(),
          highlight: false,
        });
      }

      // Geographic Event
      if (row.geographic_event && row.geographic_event.trim()) {
        events.push({
          id: `${row.id}-geographic`,
          year,
          month,
          eventTitle: 'Geographic Event',
          eventDescription: row.geographic_event.trim(),
          highlight: false,
        });
      }
    });

    return events;
  };

  // Fetch timeline data from Supabase
  useEffect(() => {
    const fetchTimelineData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('timeline_rows')
          .select('*')
          .order('created_at', { ascending: true });

        if (fetchError) {
          console.error('Error fetching timeline rows:', fetchError);
          setError(`Failed to load timeline: ${fetchError.message || 'Unknown error'}`);
          setIsLoading(false);
          return;
        }

        if (data) {
          const events = transformToTimelineEvents(data);
          setTimelineEvents(events);
        } else {
          setTimelineEvents([]);
        }
      } catch (err) {
        console.error('Unexpected error fetching timeline:', err);
        setError(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimelineData();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#305669]"></div>
          <p className="text-gray-600 mt-4">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error</p>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[#305669] mb-2">
          Timeline View
        </h1>
        <p className="text-gray-600">
          A visual journey through your key milestones and events.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          {timelineEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No timeline events found.</p>
              <p className="text-sm text-gray-500">
                Add events in the{' '}
                <a href="/my-timeline" className="text-[#305669] hover:underline font-semibold">
                  My Timeline
                </a>{' '}
                page to see them here.
              </p>
            </div>
          ) : (
            <VerticalTimeline events={timelineEvents} />
          )}
        </div>
      </div>
    </div>
  );
}

