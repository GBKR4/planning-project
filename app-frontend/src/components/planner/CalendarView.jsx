import { useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { PRIORITY_COLORS } from '../../utils/constants';
import { Clock, CheckCircle2, XCircle, AlertCircle, Ban } from 'lucide-react';

const localizer = momentLocalizer(moment);

const CalendarView = ({ blocks = [], busyBlocks = [], onSelectEvent, selectedDate, onNavigate }) => {
  // Convert blocks to calendar events
  const events = useMemo(() => {
    const blockEvents = blocks.map(block => ({
      id: block.id,
      title: block.task_title || block.title || 'Task',
      start: new Date(block.start_at),
      end: new Date(block.end_at),
      resource: {
        type: 'task',
        status: block.status,
        priority: block.priority || 3,
        blockId: block.id,
        taskId: block.task_id,
        reason: block.reason,
      }
    }));

    const busyEvents = busyBlocks.map(block => ({
      id: `busy-${block.id}`,
      title: `🚫 ${block.title}`,
      start: new Date(block.start_at),
      end: new Date(block.end_at),
      resource: {
        type: 'busy',
        blockId: block.id,
      }
    }));

    return [...blockEvents, ...busyEvents];
  }, [blocks, busyBlocks]);

  // Custom event styling with gradients
  const eventStyleGetter = (event) => {
    const { type, status, priority } = event.resource;

    let style = {
      borderRadius: '10px',
      border: 'none',
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      padding: '6px 10px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    };

    if (type === 'busy') {
      style.background = 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)';
      style.color = 'white';
      style.border = '2px solid rgba(255, 255, 255, 0.3)';
    } else if (type === 'task') {
      if (status === 'done') {
        style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
        style.color = 'white';
        style.opacity = '0.9';
      } else if (status === 'missed') {
        style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
        style.color = 'white';
        style.opacity = '0.85';
      } else {
        // Use priority colors with gradients for scheduled blocks
        const priorityColorMap = {
          5: { bg: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)', color: 'white', shadow: 'rgba(220, 38, 38, 0.3)' },
          4: { bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white', shadow: 'rgba(245, 158, 11, 0.3)' },
          3: { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', shadow: 'rgba(16, 185, 129, 0.3)' },
          2: { bg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: 'white', shadow: 'rgba(59, 130, 246, 0.3)' },
          1: { bg: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', color: 'white', shadow: 'rgba(139, 92, 246, 0.3)' },
        };
        const colors = priorityColorMap[priority] || priorityColorMap[3];
        style.background = colors.bg;
        style.color = colors.color;
        style.boxShadow = `0 2px 8px ${colors.shadow}`;
      }
    }

    return { style };
  };

  // Custom event component with icons and badges
  const EventComponent = ({ event }) => {
    const { type, status, priority } = event.resource;
    
    const getStatusIcon = () => {
      if (status === 'done') return <CheckCircle2 className="w-3 h-3" />;
      if (status === 'missed') return <XCircle className="w-3 h-3" />;
      if (type === 'busy') return <Ban className="w-3 h-3" />;
      return <Clock className="w-3 h-3" />;
    };

    const getPriorityLabel = () => {
      const labels = { 5: 'URGENT', 4: 'HIGH', 3: 'NORMAL', 2: 'LOW', 1: 'MINIMAL' };
      return labels[priority] || 'NORMAL';
    };

    return (
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-start gap-1.5">
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon()}
          </div>
          <span className="font-semibold truncate leading-tight flex-1">{event.title}</span>
        </div>
        {event.resource.reason && (
          <span className="text-xs opacity-90 truncate mt-0.5 italic">{event.resource.reason}</span>
        )}
        {type === 'task' && status === 'scheduled' && (
          <div className="mt-1">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/25 backdrop-blur-sm">
              {getPriorityLabel()}
            </span>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="h-[600px] bg-gradient-to-br from-white via-gray-50 to-purple-50 rounded-2xl shadow-xl border-2 border-purple-100 p-6 calendar-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={onSelectEvent}
        defaultView="day"
        views={['month', 'week', 'day']}
        date={selectedDate ? new Date(selectedDate) : new Date()}
        onNavigate={onNavigate}
        components={{
          event: EventComponent,
        }}
        step={15}
        timeslots={4}
        min={new Date(1970, 1, 1, 6, 0, 0)}
        max={new Date(1970, 1, 1, 23, 59, 59)}
        popup
        tooltipAccessor={(event) => {
          const { type, status, reason, priority } = event.resource;
          if (type === 'busy') return `🚫 Busy: ${event.title}`;
          const priorityText = { 5: '🔴 Critical', 4: '🟠 High', 3: '🟢 Normal', 2: '🔵 Low', 1: '⚪ Minimal' };
          return `${event.title}\n${priorityText[priority] || ''}\nStatus: ${status}\n${reason || ''}`;
        }}
      />
    </div>
  );
};

export default CalendarView;
