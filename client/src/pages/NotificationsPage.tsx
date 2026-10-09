import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle,
  Volume2,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { Notification } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { playNotificationBell } from '../utils/sound';

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      // ignore
    }
  };

  const handleItemClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await api.markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (notif.linkUrl) {
      navigate(notif.linkUrl);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-yellow-50/40 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-amber-200/70 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 border-2 border-amber-300/90 shadow-md shadow-amber-500/20 flex items-center justify-center p-0.5 flex-shrink-0 group hover:scale-105 transition-all duration-300 overflow-hidden">
            <img
              src="/icons/notifications-icon.png?v=1"
              alt="Icon ແຈ້ງເຕືອນ"
              className="w-full h-full object-contain rounded-full drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.nav.notifications}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              ສູນລວມການແຈ້ງເຕືອນເອກະສານ, ວຽກງານ ແລະ ການອະນຸມັດ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
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
                  popup: 'swal2-animated-toast shadow-2xl',
                },
              });
            }}
            className="bg-white/90 text-amber-900 border-amber-300 hover:bg-amber-100/70"
            title="ກົດເພື່ອທົດສອບສຽງກະລິ່ງ ແລະ ລະບົບສັ່ນ"
          >
            <Volume2 className="w-4 h-4 mr-1.5 text-amber-600" />
            ທົດສອບສຽງກະລິ່ງ
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="bg-white/90 text-amber-900 border-amber-300 hover:bg-amber-50"
            >
              <CheckCheck className="w-4 h-4 mr-1.5 text-amber-600" />
              {t.header.markAllRead}
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <Card noPadding>
        {notifications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Bell className="w-12 h-12 text-slate-300" />}
              title="ບໍ່ມີການແຈ້ງເຕືອນ"
              description="ທ່ານໄດ້ອ່ານການແຈ້ງເຕືອນທັງໝົດແລ້ວ ຫຼື ຍັງບໍ່ມີລາຍການໃໝ່"
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-4 flex items-start justify-between gap-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                  !notif.isRead ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="mt-1 shrink-0">
                    {notif.type === 'URGENT' || notif.type === 'WARNING' ? (
                      <span className="p-2 bg-red-50 text-red-600 rounded-xl inline-block">
                        <AlertCircle className="w-4 h-4" />
                      </span>
                    ) : notif.type === 'SUCCESS' ? (
                      <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl inline-block">
                        <CheckCircle className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-2 bg-blue-50 text-blue-600 rounded-xl inline-block">
                        <Bell className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-1.5">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(notif.createdAt).toLocaleString('lo-LA')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleDelete(notif.id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="ລຶບການແຈ້ງເຕືອນ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
