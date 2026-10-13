import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2, ExternalLink, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { api } from '../../api/client';
import { Notification } from '../../types';
import { Badge } from '../ui/Badge';
import { playNotificationBell } from '../../utils/sound';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const previousUnreadRef = useRef<number | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        if (previousUnreadRef.current !== null && res.unreadCount > previousUnreadRef.current) {
          // Play ringing bell chime sound & device vibration
          playNotificationBell();

          const newNotifs = res.data.filter(n => !n.isRead);
          const latest = newNotifs[0];
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: latest ? `🔔 ${latest.title}` : '🔔 ມີແຈ້ງເຕືອນໃໝ່!',
            text: latest ? latest.message : `ທ່ານມີ ${res.unreadCount} ແຈ້ງເຕືອນໃໝ່ທີ່ຍັງບໍ່ໄດ້ອ່ານ`,
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true,
            customClass: {
              popup: 'swal2-animated-toast shadow-2xl'
            }
          });
        }
        previousUnreadRef.current = res.unreadCount;
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      // ignore
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await api.markNotificationRead(notif.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (notif.linkUrl) {
      navigate(notif.linkUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200 focus:outline-none ${
          unreadCount > 0
            ? 'text-amber-600 bg-amber-50/80 hover:bg-amber-100 ring-2 ring-amber-200/60 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title={unreadCount > 0 ? `ມີ ${unreadCount} ແຈ້ງເຕືອນໃໝ່ (ກະລິ່ງດັ່ງ)` : 'ແຈ້ງເຕືອນ'}
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bell-shake text-amber-500' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-full border-2 border-white shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3.5 border-b border-slate-200/90 bg-gradient-to-r from-slate-50/95 via-sky-50/50 to-blue-50/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">ແຈ້ງເຕືອນ</span>
              {unreadCount > 0 && (
                <Badge variant="danger" size="sm" icon={<Bell className="w-3 h-3" />}>
                  {unreadCount} ໃໝ່
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playNotificationBell();
                  Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: '🔔 ທົດສອບສຽງແຈ້ງເຕືອນ',
                    text: 'ສຽງກະລິ່ງ ແລະ ລະບົບສັ່ນດັງເຮັດວຽກປົກກະຕິ',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    customClass: {
                      popup: 'swal2-animated-toast shadow-2xl'
                    }
                  });
                }}
                className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-amber-700 bg-white/80 hover:bg-amber-50 border border-slate-200/80 rounded-lg flex items-center gap-1 transition-all shadow-2xs"
                title="ກົດເພື່ອທົດສອບສຽງກະລິ່ງແຈ້ງເຕືອນ"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                ທົດສອບສຽງ
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  ອ່ານໝົດແລ້ວ
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                ບໍ່ມີການແຈ້ງເຕືອນໃໝ່
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 text-xs transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                    !notif.isRead ? 'bg-blue-50/40 font-medium' : ''
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {notif.type === 'URGENT' || notif.type === 'WARNING' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    ) : notif.type === 'SUCCESS' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-slate-800 font-semibold mb-0.5">
                      <span className="truncate">{notif.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal ml-2 shrink-0">
                        {new Date(notif.createdAt).toLocaleTimeString('lo-LA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-2 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs text-slate-600 hover:text-blue-600 font-semibold py-1"
            >
              ເບິ່ງການແຈ້ງເຕືອນທັງໝົດ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
