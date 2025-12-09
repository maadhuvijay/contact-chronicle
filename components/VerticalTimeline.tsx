'use client';

import { useEffect, useRef, useState } from 'react';

export interface TimelineEvent {
  id: string;
  year: number;
  month: number; // 1-12
  eventTitle: string;
  eventDescription: string;
  highlight?: boolean;
  eventType?: 'Professional' | 'Personal' | 'Geographic';
}

interface VerticalTimelineProps {
  events: TimelineEvent[];
}

// Month color palette (1-12)
const MONTH_COLORS: Record<number, string> = {
  1: '#00B6FF',
  2: '#00B6FF',
  3: '#00B6FF',
  4: '#00C4CC',
  5: '#FF7A30',
  6: '#FF7A30',
  7: '#FF7A30',
  8: '#FF7A30',
  9: '#FF4F7B',
  10: '#FF4F7B',
  11: '#FF4F7B',
  12: '#FF4F7B',
};

// Month names
const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

export default function VerticalTimeline({ events }: VerticalTimelineProps) {
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Sort events by year and month
  const sortedEvents = [...events].sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    return a.month - b.month;
  });

  // Group events by year
  const eventsByYear = sortedEvents.reduce((acc, event) => {
    if (!acc[event.year]) {
      acc[event.year] = [];
    }
    acc[event.year].push(event);
    return acc;
  }, {} as Record<number, TimelineEvent[]>);

  const sortedYears = Object.keys(eventsByYear)
    .map(Number)
    .sort((a, b) => a - b);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const itemId = entry.target.getAttribute('data-item-id');
            if (itemId) {
              setVisibleItems((prev) => new Set(prev).add(itemId));
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    itemRefs.current.forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      itemRefs.current.forEach((ref) => {
        if (ref) {
          observer.unobserve(ref);
        }
      });
    };
  }, [sortedEvents]);

  const getMonthColor = (month: number): string => {
    return MONTH_COLORS[month] || '#00B6FF';
  };

  const getEventTypeSymbol = (eventType?: string, eventTitle?: string): string => {
    // First try eventType if provided
    if (eventType) {
      switch (eventType) {
        case 'Personal':
          return '❤️';
        case 'Professional':
          return '💼';
        case 'Geographic':
          return '📍';
        default:
          break;
      }
    }
    
    // Fallback: try to determine from eventTitle
    if (eventTitle) {
      const titleLower = eventTitle.toLowerCase();
      if (titleLower.includes('personal')) {
        return '❤️';
      } else if (titleLower.includes('professional')) {
        return '💼';
      } else if (titleLower.includes('geographic')) {
        return '📍';
      }
    }
    
    return '';
  };

  if (sortedEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No timeline events to display.</p>
      </div>
    );
  }

  // Calculate total events before each year for global indexing
  let globalEventIndex = 0;
  const eventsBeforeYear: Record<number, number> = {};
  sortedYears.forEach((year) => {
    eventsBeforeYear[year] = globalEventIndex;
    globalEventIndex += eventsByYear[year].length;
  });

  return (
    <div className="w-full py-8">
      {sortedYears.map((year, yearIndex) => {
        const yearEvents = eventsByYear[year];
        const isLastYear = yearIndex === sortedYears.length - 1;

        return (
          <div key={year} className="mb-16 last:mb-0">
            {/* Year Header */}
            <div className="text-center mb-12">
              <h2 className="text-5xl md:text-6xl font-bold text-gray-800">
                <span className="text-gray-800">{year.toString().slice(0, 2)}</span>
                <span className="text-[#305669]">{year.toString().slice(2)}</span>
              </h2>
            </div>

            {/* Timeline Container */}
            <div className="relative max-w-4xl mx-auto px-4 md:px-8">
              {/* Central Vertical Line */}
              <div
                className="absolute left-1/2 transform -translate-x-1/2 bg-gray-300 z-0 hidden md:block"
                style={{
                  width: '4px',
                  top: '0',
                  bottom: isLastYear ? '0' : '-4rem',
                  height: isLastYear ? 'auto' : 'calc(100% + 4rem)',
                }}
                aria-hidden="true"
              />
              {/* Mobile Vertical Line - centered and visible on mobile */}
              <div
                className="absolute left-1/2 transform -translate-x-1/2 bg-gray-300 z-0 md:hidden"
                style={{
                  width: '3px',
                  top: '0',
                  bottom: isLastYear ? '0' : '-4rem',
                  height: isLastYear ? 'auto' : 'calc(100% + 4rem)',
                }}
                aria-hidden="true"
              />

              {/* Timeline Events */}
              <div className="relative space-y-16 md:space-y-20">
                {yearEvents.map((event, eventIndex) => {
                  // Calculate global index for proper alternation across all years
                  const globalIndex = eventsBeforeYear[year] + eventIndex;
                  const isLeft = globalIndex % 2 === 0;
                  const monthColor = getMonthColor(event.month);
                  const itemId = `${year}-${event.month}-${event.id}`;
                  const isVisible = visibleItems.has(itemId);
                  const eventSymbol = getEventTypeSymbol(event.eventType, event.eventTitle);

                  return (
                    <div
                      key={event.id}
                      data-item-id={itemId}
                      ref={(el) => {
                        if (el) {
                          itemRefs.current.set(itemId, el);
                        }
                      }}
                      className={`relative flex flex-col items-center ${
                        isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                      }`}
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transition: 'opacity 200ms ease-in',
                      }}
                      role="article"
                      aria-label={`Timeline event: ${MONTH_NAMES[event.month - 1]} ${year}`}
                    >
                      {/* Event Content Card */}
                      <div
                        className={`w-full md:w-5/12 ${
                          isLeft ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'
                        } order-2 md:order-1 text-left`}
                      >
                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200">
                          {/* Month Name */}
                          <div className={`mb-3 text-left ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
                            <div className={`text-xs md:text-base font-medium text-gray-600 uppercase tracking-wider flex items-center gap-2 ${isLeft ? 'md:justify-end' : ''}`}>
                              <span>{MONTH_NAMES[event.month - 1]}</span>
                              {eventSymbol && (
                                <span className="text-sm">{eventSymbol}</span>
                              )}
                            </div>
                          </div>

                          {/* Event Title */}
                          {event.eventTitle && (
                            <h3 className="text-base md:text-xl font-semibold text-gray-900 mb-2">
                              {event.eventTitle}
                            </h3>
                          )}

                          {/* Event Description */}
                          {event.eventDescription && (
                            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                              {event.eventDescription}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Timeline Marker Container */}
                      <div className="relative z-10 flex-shrink-0 order-1 md:order-2 w-full md:w-2/12 flex justify-center my-4 md:my-0">
                        {/* Large Highlight Bubble */}
                        {event.highlight && (
                          <div
                            className="absolute rounded-full opacity-20"
                            style={{
                              width: '100px',
                              height: '100px',
                              backgroundColor: monthColor,
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                            }}
                            aria-hidden="true"
                          />
                        )}

                        {/* Timeline Marker Circle */}
                        <div
                          className="relative rounded-full border-2 border-gray-400 z-10"
                          style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: monthColor,
                          }}
                          aria-label={`${MONTH_NAMES[event.month - 1]} ${year}: ${event.eventTitle || 'Timeline event'}`}
                          role="img"
                          tabIndex={0}
                        />
                      </div>

                      {/* Spacer for alternating layout */}
                      <div className="hidden md:block md:w-5/12 order-3" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
