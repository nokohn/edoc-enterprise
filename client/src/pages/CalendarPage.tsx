import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  CheckSquare,
  FileText,
} from 'lucide-react';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { CalendarEvent, Department } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const CalendarPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Event Form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'MEETING',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    location: '',
    color: '#2563eb',
    departmentId: '',
  });

  const fetchEvents = async () => {
    try {
      const res = await api.getCalendarEvents();
      if (res.success && res.data) {
        setEvents(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEvents();
    api.getDepartments().then((res) => {
      if (res.success) setDepartments(res.data);
    });
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    try {
      await api.createCalendarEvent(formData);
      Swal.fire({
        icon: 'success',
        title: 'ສ້າງກິດຈະກຳສຳເລັດ',
        timer: 1500,
        showConfirmButton: false,
      });
      setCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        eventType: 'MEETING',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        location: '',
        color: '#2563eb',
        departmentId: '',
      });
      fetchEvents();
    } catch (e) {
      // ignore
    }
  };

  // Calendar Grid Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'ມັງກອນ (January)',
    'ກຸມພາ (February)',
    'ມີນາ (March)',
    'ເມສາ (April)',
    'ພຶດສະພາ (May)',
    'ມິຖຸນາ (June)',
    'ກໍລະກົດ (July)',
    'ສິງຫາ (August)',
    'ກັນຍາ (September)',
    'ຕຸລາ (October)',
    'ພະຈິກ (November)',
    'ທັນວາ (December)',
  ];

  const days = [];
  // Previous month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
  }
  // Current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true });
  }
  // Next month padding
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isCurrentMonth: false });
  }

  const getEventsForDay = (dayNum: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return [];
    return events.filter((ev) => {
      const d = new Date(ev.startDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === dayNum;
    });
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-cyan-50/40 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-teal-200/70 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-100/80 via-emerald-50 to-cyan-100/80 border-2 border-teal-300/80 shadow-md shadow-teal-500/15 flex items-center justify-center p-1.5 flex-shrink-0 group hover:scale-105 transition-all duration-300 overflow-hidden">
            <img
              src="/icons/calendar-icon.png?v=1"
              alt="Icon ຕາຕະລາງວຽກງານ"
              className="w-full h-full object-cover rounded-xl filter contrast-105 drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.nav.calendar}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              ຕາຕະລາງກິດຈະກຳ, ກອງປະຊຸມ, ແລະ ກຳນົດເວລາສົ່ງວຽກງານ / ເອກະສານ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday} className="bg-white/90">
            ມື້ນີ້ (Today)
          </Button>
          <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-50 rounded-l-xl text-slate-600 transition-colors"
              title="ເດືອນກ່ອນ"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-50 rounded-r-xl text-slate-600 transition-colors"
              title="ເດືອນຖັດໄປ"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Button
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            className="text-[16px] font-semibold py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white border border-teal-700/30 shadow-md shadow-teal-600/20"
          >
            <Plus className="w-5 h-5 mr-1 text-white" />
            ເພີ່ມກິດຈະກຳ
          </Button>
        </div>
      </div>

      {/* Month Title Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-sky-50/80 via-blue-50/40 to-indigo-50/30">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              {monthNames[month]} {year}
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> ກອງປະຊຸມ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> ກຳນົດສົ່ງວຽກ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> ຮີບດ່ວນ
            </span>
          </div>
        </div>

        {/* Days of Week Header Bar and Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-7 border-b border-slate-200/90 text-center text-xs font-bold text-slate-700 bg-gradient-to-r from-slate-100/95 via-sky-50/60 to-slate-100/95 py-2.5">
              <span>ອາທິດ (Sun)</span>
              <span>ຈັນ (Mon)</span>
              <span>ອັງຄານ (Tue)</span>
              <span>ພຸດ (Wed)</span>
              <span>ພະຫັດ (Thu)</span>
              <span>ສຸກ (Fri)</span>
              <span>ເສົາ (Sat)</span>
            </div>

            {/* Calendar Grid (42 cells) */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 text-xs">
          {days.map((d, idx) => {
            const dayEvents = getEventsForDay(d.day, d.isCurrentMonth);
            const isToday =
              d.isCurrentMonth &&
              new Date().getDate() === d.day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={idx}
                className={`min-h-[105px] p-2 flex flex-col justify-between transition-colors ${
                  !d.isCurrentMonth ? 'bg-slate-50/40 text-slate-300' : 'bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${
                      isToday
                        ? 'bg-blue-600 text-white font-bold'
                        : d.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-300'
                    }`}
                  >
                    {d.day}
                  </span>
                  {dayEvents.length > 2 && (
                    <span className="text-[10px] text-slate-400 font-bold">
                      +{dayEvents.length - 2}
                    </span>
                  )}
                </div>

                {/* Day's Event Badges */}
                <div className="flex-1 space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setSelectedEvent(ev);
                        setEventModalOpen(true);
                      }}
                      className="px-2 py-0.5 rounded text-[11px] font-medium text-white truncate cursor-pointer shadow-2xs hover:brightness-95 transition-all"
                      style={{ backgroundColor: ev.color || '#2563eb' }}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          isOpen={eventModalOpen}
          onClose={() => setEventModalOpen(false)}
          title={selectedEvent.title}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedEvent.color || '#2563eb' }}
              />
              <span className="font-semibold text-slate-700">
                {selectedEvent.eventType === 'TASK_DUE'
                  ? 'ກຳນົດເວລາສົ່ງວຽກ (Task Deadline)'
                  : selectedEvent.eventType === 'MEETING'
                  ? 'ກອງປະຊຸມ (Meeting)'
                  : 'ກິດຈະກຳ (Event)'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  {new Date(selectedEvent.startDate).toLocaleString('lo-LA')}
                </span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
            </div>

            {selectedEvent.description && (
              <div>
                <h4 className="font-bold text-slate-800 mb-1">ລາຍລະອຽດ:</h4>
                <p className="text-slate-600 leading-relaxed">{selectedEvent.description}</p>
              </div>
            )}

            {/* Jump to linked task or document */}
            {selectedEvent.taskId && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setEventModalOpen(false);
                  navigate(`/task-tracking?id=${selectedEvent.taskId}`);
                }}
              >
                <CheckSquare className="w-4 h-4 mr-1.5" />
                ເປີດເບິ່ງວຽກງານນີ້
              </Button>
            )}
          </div>
        </Modal>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="ເພີ່ມກິດຈະກຳ ຫຼື ກອງປະຊຸມໃໝ່"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4 text-xs sm:text-sm">
          <div>
            <Input
              label="ຫົວຂໍ້ກິດຈະກຳ / ກອງປະຊຸມ"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="ເຊັ່ນ: ກອງປະຊຸມຄະນະບໍລິຫານ..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ປະເພດກິດຈະກຳ
              </label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white"
              >
                <option value="MEETING">ກອງປະຊຸມ (Meeting)</option>
                <option value="EVENT">ກິດຈະກຳທົ່ວໄປ (Event)</option>
                <option value="APPROVAL">ກຳນົດອະນຸມັດ (Approval)</option>
                <option value="HOLIDAY">ວັນພັກລັດຖະການ (Holiday)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ສີສະແດງຜົນ
              </label>
              <div className="flex items-center gap-2 mt-2">
                {['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      formData.color === c ? 'border-slate-800 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="ວັນທີເລີ່ມ"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              type="date"
              label="ວັນທີສິ້ນສຸດ"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div>
            <Input
              label="ສະຖານທີ່"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="ເຊັ່ນ: ຫ້ອງປະຊຸມໃຫຍ່ ຊັ້ນ 4"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ລາຍລະອຽດ
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="ລາຍລະອຽດ ຫຼື ວາລະກອງປະຊຸມ..."
              className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              ຍົກເລີກ
            </Button>
            <Button type="submit" variant="primary">
              ບັນທຶກກິດຈະກຳ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
