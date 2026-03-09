import { useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { MdBlock, MdCheckCircle, MdCoffee, MdOutlineSchedule, MdWarning } from 'react-icons/md';

const localizer = momentLocalizer(moment);

const getPriorityLabel = (priority) => {
  const labels = { 5: 'Critical', 4: 'High', 3: 'Normal', 2: 'Low', 1: 'Minimal' };
  return labels[priority] || 'Normal';
};

const CalendarView = ({ blocks = [], busyBlocks = [], onSelectEvent, selectedDate, onNavigate }) => {
  const events = useMemo(() => {
    const blockEvents = blocks.map((block) => {
      const isBreak = block.block_type === 'break' || block.task_id === null;

      return {
        id: block.id,
        title: isBreak ? 'Break' : block.task_title || block.title || 'Task',
        start: new Date(block.start_at),
        end: new Date(block.end_at),
        resource: {
          type: isBreak ? 'break' : 'task',
          status: block.status,
          priority: block.priority || 3,
          blockId: block.id,
          taskId: block.task_id,
          reason: block.reason,
        },
      };
    });

    const busyEvents = busyBlocks.map((block) => ({
      id: `busy-${block.id}`,
      title: block.title,
      start: new Date(block.start_at),
      end: new Date(block.end_at),
      resource: {
        type: 'busy',
        blockId: block.id,
      },
    }));

    return [...blockEvents, ...busyEvents];
  }, [blocks, busyBlocks]);

  const eventStyleGetter = (event) => {
    const { type, status, priority } = event.resource;
    const style = {
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      display: 'block',
      fontSize: '12px',
      fontWeight: '600',
      padding: '6px 8px',
      cursor: 'pointer',
      color: '#111827',
      backgroundColor: '#ffffff',
    };

    if (type === 'busy') {
      style.backgroundColor = '#e5e7eb';
      style.borderColor = '#9ca3af';
    } else if (type === 'break') {
      style.backgroundColor = '#f3f4f6';
      style.borderStyle = 'dashed';
    } else if (status === 'done') {
      style.backgroundColor = '#d1d5db';
      style.borderColor = '#6b7280';
    } else if (status === 'missed') {
      style.backgroundColor = '#e5e7eb';
      style.borderColor = '#4b5563';
    } else {
      const borderByPriority = {
        5: '#111827',
        4: '#374151',
        3: '#4b5563',
        2: '#6b7280',
        1: '#9ca3af',
      };
      style.borderColor = borderByPriority[priority] || '#6b7280';
    }

    return { style };
  };

  const EventComponent = ({ event }) => {
    const { type, status, priority, reason } = event.resource;

    const renderIcon = () => {
      if (type === 'busy') return <MdBlock className="h-3.5 w-3.5" />;
      if (type === 'break') return <MdCoffee className="h-3.5 w-3.5" />;
      if (status === 'done') return <MdCheckCircle className="h-3.5 w-3.5" />;
      if (status === 'missed') return <MdWarning className="h-3.5 w-3.5" />;
      return <MdOutlineSchedule className="h-3.5 w-3.5" />;
    };

    return (
      <div className="flex h-full flex-col justify-between gap-1">
        <div className="flex items-start gap-1.5">
          <span className="mt-0.5 shrink-0">{renderIcon()}</span>
          <span className="truncate leading-tight">{event.title}</span>
        </div>
        {type === 'task' && status === 'scheduled' && (
          <span className="text-[10px] uppercase tracking-wide text-gray-600">{getPriorityLabel(priority)}</span>
        )}
        {reason && <span className="truncate text-[10px] text-gray-500">{reason}</span>}
      </div>
    );
  };

  return (
    <div className="calendar-container h-[600px] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
        components={{ event: EventComponent }}
        step={15}
        timeslots={4}
        min={new Date(1970, 1, 1, 6, 0, 0)}
        max={new Date(1970, 1, 1, 23, 59, 59)}
        popup
        tooltipAccessor={(event) => {
          const { type, status, reason, priority } = event.resource;
          if (type === 'busy') return `Busy: ${event.title}`;
          if (type === 'break') return 'Break';
          return `${event.title}\nPriority: ${getPriorityLabel(priority)}\nStatus: ${status}${reason ? `\n${reason}` : ''}`;
        }}
      />
    </div>
  );
};

export default CalendarView;
