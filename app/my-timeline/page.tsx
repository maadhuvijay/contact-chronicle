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

  // Fetch all timeline rows from Supabase
  const fetchTimelineRows = async () => {
    setIsLoadingTimeline(true);
    try {
      const { data, error } = await supabase
        .from('timeline_rows')
        .select('*')
        .order('created_at', { ascending: true });

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

      setSavedTimelineRows(convertedRows);
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

  // Initialize page with single empty row and check for saved entries
  useEffect(() => {
    // Always start with one empty row for new entries
    setIsLoading(false);
    // Check if there are any saved entries in the database
    checkForSavedEntries();
  }, []);

  const handleConfirm = async () => {
    try {
      // Prepare data for insertion (exclude the temporary id)
      // Filter out completely empty rows
      const rowsToInsert = timelineRows
        .filter((row) => {
          // Keep rows that have at least one field filled
          return row.monthYear.trim() || 
                 row.professionalEvent.trim() || 
                 row.personalEvent.trim() || 
                 row.geographicEvent.trim();
        })
        .map((row) => ({
          month_year: row.monthYear,
          professional_event: row.professionalEvent,
          personal_event: row.personalEvent,
          geographic_event: row.geographicEvent,
        }));

      // If no valid rows to insert, show message and return
      if (rowsToInsert.length === 0) {
        alert('Please fill in at least one field in at least one row before saving.');
        return;
      }

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
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-[#305669] text-white rounded-md hover:bg-[#244a5a] transition-colors font-semibold"
            >
              Confirm Timeline
            </button>
            {hasSavedEntries && (
              <button
                onClick={handleViewTimeline}
                disabled={isLoadingTimeline}
                className="px-6 py-3 bg-[#8ABEB9] text-white rounded-md hover:bg-[#7aada8] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingTimeline ? 'Loading...' : showTimelineView ? 'Hide Timeline' : 'View Timeline'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      {showTimelineView && (
        <div className="mt-8 rounded-lg overflow-hidden shadow-lg">
          <div className="relative" style={{
            backgroundColor: '#F5D2D2',
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.02) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}>
            {isLoadingTimeline ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading timeline...</p>
              </div>
            ) : savedTimelineRows.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No timeline entries found. Add some entries and save them to see your timeline.</p>
              </div>
            ) : (
              <TimelineVisualization rows={savedTimelineRows} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Timeline Visualization Component - Premium Editorial Design
function TimelineVisualization({ rows }: { rows: TimelineRow[] }) {
  const [containerWidth, setContainerWidth] = useState(1200);

  // Extract year from monthYear (format: MM/YYYY or YYYY)
  const extractYear = (monthYear: string): string => {
    if (!monthYear.trim()) return '';
    const parts = monthYear.split('/');
    if (parts.length === 2) return parts[1]; // MM/YYYY format
    if (parts.length === 1 && parts[0].length === 4) return parts[0]; // YYYY format
    return monthYear;
  };

  // Get primary event text (first non-empty event)
  const getPrimaryEvent = (row: TimelineRow): string => {
    if (row.professionalEvent.trim()) return row.professionalEvent;
    if (row.personalEvent.trim()) return row.personalEvent;
    if (row.geographicEvent.trim()) return row.geographicEvent;
    return '';
  };

  // Get minimalist icon based on event type
  const getMinimalistIcon = (row: TimelineRow) => {
    if (row.professionalEvent.trim()) {
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .414-.336.75-.75.75h-4.5a.75.75 0 01-.75-.75v-4.25m0 0h-4.5m4.5 0V9.75m-4.5 0h4.5m-4.5 0l-4.5-4.5m4.5 4.5l4.5-4.5" />
        </svg>
      );
    }
    if (row.personalEvent.trim()) {
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      );
    }
    if (row.geographicEvent.trim()) {
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      );
    }
    return null;
  };

  // Calculate positions for curved timeline
  const timelineHeight = 400;
  const milestoneRadius = 60;
  const minSpacing = 280;
  const spacing = rows.length > 1 
    ? Math.max(minSpacing, (containerWidth - 200) / (rows.length - 1))
    : minSpacing;
  const curveAmplitude = 30;

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setContainerWidth(window.innerWidth);
      }
    };

    if (typeof window !== 'undefined') {
      setContainerWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Ref callback to measure container
  const containerRef = (el: HTMLDivElement | null) => {
    if (el) {
      const width = el.offsetWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200);
      setContainerWidth(width);
    }
  };

  // Generate SVG path for curved timeline with alternating segments
  const generateTimelinePath = () => {
    if (rows.length === 0) return '';
    
    const startX = 100;
    const endX = startX + (rows.length - 1) * spacing;
    const centerY = timelineHeight / 2;
    
    // Create a smooth curve
    const controlPoints = [];
    for (let i = 0; i < rows.length - 1; i++) {
      const x1 = startX + i * spacing;
      const x2 = startX + (i + 1) * spacing;
      const midX = (x1 + x2) / 2;
      const y = centerY + Math.sin((i / rows.length) * Math.PI * 2) * curveAmplitude;
      controlPoints.push({ x: midX, y });
    }

    let path = `M ${startX} ${centerY}`;
    for (let i = 0; i < controlPoints.length; i++) {
      const cp = controlPoints[i];
      const nextX = startX + (i + 1) * spacing;
      path += ` Q ${cp.x} ${cp.y} ${nextX} ${centerY}`;
    }

    return path;
  };

  return (
    <div className="relative w-full overflow-x-auto py-16" ref={containerRef}>
      <div className="min-w-full" style={{ minHeight: `${timelineHeight}px`, minWidth: `${Math.max(1200, (rows.length - 1) * spacing + 200)}px` }}>
        {/* SVG Timeline Path */}
        <svg className="absolute top-0 left-0 w-full h-full" style={{ height: `${timelineHeight}px` }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          
          {/* Curved timeline path with alternating segments */}
          <path
            d={generateTimelinePath()}
            fill="none"
            stroke="url(#timelineGradient)"
            strokeWidth="2"
            strokeDasharray={rows.length > 1 ? "8 4" : "0"}
            strokeLinecap="round"
            className="drop-shadow-sm"
          />
        </svg>

        {/* Milestones */}
        <div className="relative flex items-center justify-around px-8" style={{ height: `${timelineHeight}px` }}>
          {rows.map((row, index) => {
            const year = extractYear(row.monthYear);
            const primaryEvent = getPrimaryEvent(row);
            const xPosition = 100 + index * spacing;
            const yOffset = Math.sin((index / rows.length) * Math.PI * 2) * curveAmplitude;
            const isEven = index % 2 === 0;

            return (
              <div
                key={row.id}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${xPosition}px`,
                  transform: `translateX(-50%) translateY(${yOffset}px)`,
                }}
              >
                {/* Year Number - Above or below based on index */}
                {year && (
                  <div
                    className={`text-4xl font-bold tracking-tight mb-4 ${isEven ? 'order-1' : 'order-3 mt-4'}`}
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#640D5F' }}
                  >
                    {year}
                  </div>
                )}

                {/* Circular Milestone Marker */}
                <div
                  className={`relative order-2 ${isEven ? 'mb-4' : 'mt-4'}`}
                >
                  <div
                    className="relative rounded-full border-2 border-gray-300 bg-white shadow-lg"
                    style={{
                      width: `${milestoneRadius * 2}px`,
                      height: `${milestoneRadius * 2}px`,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    {/* Image Placeholder - Grayscale */}
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full bg-gray-200 opacity-40 flex items-center justify-center">
                        {getMinimalistIcon(row)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descriptive Text Block */}
                {primaryEvent && (
                  <div
                    className={`text-center max-w-[200px] ${isEven ? 'order-3 mt-4' : 'order-1 mb-4'}`}
                  >
                    <div className="text-sm font-light text-gray-600 leading-relaxed tracking-wide">
                      {primaryEvent.length > 50 ? `${primaryEvent.substring(0, 50)}...` : primaryEvent}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Topographic/Wave Pattern at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path
              d="M0,50 Q150,20 300,50 T600,50 T900,50 T1200,50 L1200,100 L0,100 Z"
              fill="currentColor"
              className="text-gray-400"
            />
            <path
              d="M0,60 Q200,30 400,60 T800,60 T1200,60 L1200,100 L0,100 Z"
              fill="currentColor"
              className="text-gray-300"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

