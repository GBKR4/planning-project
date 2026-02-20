import { useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { PRIORITY_COLORS } from '../../utils/constants';
import { Clock, CheckCircle2, XCircle, AlertCircle, Ban, Coffee } from 'lucide-react';

const localizer = momentLocalizer(moment);

const CalendarView = ({ blocks = [], busyBlocks = [], onSelectEvent, selectedDate, onNavigate }) => {
  // Convert blocks to calendar events
  const events = useMemo(() => {
    const blockEvents = blocks.map(block => {
      // Check if this is a break block
      const isBreak = block.block_type === 'break' || block.task_id === null;
      
      return {
        id: block.id,
        title: isBreak ? '☕ Break' : (block.task_title || block.title || 'Task'),
        start: new Date(block.start_at),
        end: new Date(block.end_at),
        resource: {
          type: isBreak ? 'break' : 'task',
          status: block.status,
          priority: block.priority || 3,
          blockId: block.id,
          taskId: block.task_id,
          reason: block.reason,
        }
      };
    });

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
      style.background = 'linear-gradient(135deg, #EF4444 0%, #F97316 50%, #F59E0B 100%)';
      style.color = 'white';
      style.border = '2px solid rgba(255, 255, 255, 0.5)';
      style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
    } else if (type === 'break') {
      // Break blocks styled with warm coffee/relaxation theme
      style.background = 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)';
      style.color = 'white';
      style.border = '2px dashed rgba(255, 255, 255, 0.6)';
      style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.5)';
    } else if (type === 'task') {
      if (status === 'done') {
        style.background = 'linear-gradient(135deg, #10B981 0%, #14B8A6 50%, #06B6D4 100%)';
        style.color = 'white';
        style.opacity = '0.95';
        style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.5)';
      } else if (status === 'missed') {
        style.background = 'linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #F87171 100%)';
        style.color = 'white';
        style.opacity = '0.9';
        style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.5)';
      } else {
        // Use vibrant priority colors with rainbow gradients for scheduled blocks
        const priorityColorMap = {
          5: { bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #991B1B 100%)', color: 'white', shadow: 'rgba(239, 68, 68, 0.5)' },
          4: { bg: 'linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #EA580C 100%)', color: 'white', shadow: 'rgba(249, 115, 22, 0.5)' },
          3: { bg: 'linear-gradient(135deg, #10B981 0%, #14B8A6 50%, #06B6D4 100%)', color: 'white', shadow: 'rgba(20, 184, 166, 0.5)' },
          2: { bg: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)', color: 'white', shadow: 'rgba(99, 102, 241, 0.5)' },
          1: { bg: 'linear-gradient(135deg, #A855F7 0%, #D946EF 50%, #EC4899 100%)', color: 'white', shadow: 'rgba(217, 70, 239, 0.5)' },
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
      if (type === 'break') return <Coffee className="w-3 h-3" />;
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
    <div className="h-[600px] bg-gradient-to-br from-blue-50 via-purple-50 via-pink-50 to-rose-50 rounded-2xl shadow-2xl border-4 border-transparent bg-clip-padding p-6 calendar-container" style={{borderImage: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb, #4facfe) 1'}}>
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
          if (type === 'break') return `☕ Break: Take a rest!`;
          const priorityText = { 5: '🔴 Critical', 4: '🟠 High', 3: '🟢 Normal', 2: '🔵 Low', 1: '⚪ Minimal' };
          return `${event.title}\n${priorityText[priority] || ''}\nStatus: ${status}\n${reason || ''}`;
        }}
      />
    </div>
  );
};

export default CalendarView;
