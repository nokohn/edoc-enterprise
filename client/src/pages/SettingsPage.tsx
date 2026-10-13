import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Settings as SettingsIcon,
  Building,
  Shield,
  Upload,
  Clock,
  Save,
  Database,
  Bell,
  Info,
} from 'lucide-react';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();

  const [settings, setSettings] = useState<Record<string, string>>({
    ORG_NAME_LAO: 'ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)',
    ORG_NAME_EN: 'Lao Holding State Enterprise',
    ORG_LOGO_URL: 'https://img2.pic.in.th/ChatGPT-Image-Sep-28-2026-11_11_54-AM.png',
    DEFAULT_LANGUAGE: 'lo',
    MAX_UPLOAD_SIZE_MB: '50',
    ENABLE_AUDIT_LOG: 'true',
    SESSION_TIMEOUT_MINS: '120',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getSettings().then((res) => {
      if (res.success && res.data) {
        const map: Record<string, string> = {};
        res.data.forEach((s: any) => {
          map[s.key] = s.value;
        });
        setSettings((prev) => ({ ...prev, ...map }));
      }
    });
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await api.updateSettings(payload);

      Swal.fire({
        icon: 'success',
        title: 'ບັນທຶກການຕັ້ງຄ່າສຳເລັດ',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ເກີດຂໍ້ຜິດພາດ',
        text: err.message || 'ບໍ່ສາມາດບັນທຶກການຕັ້ງຄ່າໄດ້',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/90 via-blue-50/60 to-indigo-50/40 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-blue-300/80 shadow-md shadow-blue-500/15 flex items-center justify-center p-2 flex-shrink-0 group hover:scale-105 transition-all duration-300 overflow-hidden">
            <img
              src="/icons/settings-icon.png?v=1"
              alt="Icon ຕັ້ງຄ່າລະບົບ"
              className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.nav.settings}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              ຕັ້ງຄ່າຂໍ້ມູນອົງກອນ, ຄວາມປອດໄພ, ການຈັດເກັບໄຟລ໌ ແລະ ລະບົບທົ່ວໄປ
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Settings Card */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>ຂໍ້ມູນອົງກອນ (Organization Profile)</span>
            </div>
          }
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="ຊື່ອົງກອນ (ພາສາລາວ)"
                value={settings.ORG_NAME_LAO || ''}
                onChange={(e) => handleChange('ORG_NAME_LAO', e.target.value)}
                required
              />
              <Input
                label="Organization Name (English)"
                value={settings.ORG_NAME_EN || ''}
                onChange={(e) => handleChange('ORG_NAME_EN', e.target.value)}
              />
            </div>

            <div>
              <Input
                label="ລິ້ງໂລໂກ້ອົງກອນ (Organization Logo URL)"
                value={settings.ORG_LOGO_URL || ''}
                onChange={(e) => handleChange('ORG_LOGO_URL', e.target.value)}
                placeholder="https://..."
              />
              <div className="mt-2.5 flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={settings.ORG_LOGO_URL}
                  alt="Logo Preview"
                  className="w-10 h-10 object-contain bg-white rounded-lg p-1 border border-slate-200"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.png';
                  }}
                />
                <span className="text-xs text-slate-500 font-medium">ຕົວຢ່າງການສະແດງຜົນໂລໂກ້</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Security & System Settings Card */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>ຄວາມປອດໄພ & ລະບົບ (Security & Storage)</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <Input
                label="Session Timeout (ນາທີ)"
                type="number"
                value={settings.SESSION_TIMEOUT_MINS || '120'}
                onChange={(e) => handleChange('SESSION_TIMEOUT_MINS', e.target.value)}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                ລະບົບຈະ Logout ອັດຕະໂນມັດເມື່ອບໍ່ມີການເຄື່ອນໄຫວຕາມເວລາທີ່ກຳນົດ
              </p>
            </div>

            <div>
              <Input
                label="ຂະໜາດໄຟລ໌ສູງສຸດຕໍ່ຄັ້ງ (MB)"
                type="number"
                value={settings.MAX_UPLOAD_SIZE_MB || '50'}
                onChange={(e) => handleChange('MAX_UPLOAD_SIZE_MB', e.target.value)}
              />
              <p className="text-[11px] text-slate-400 mt-1">ຂະໜາດໄຟລ໌ຄັດຕິດສູງສຸດ (PDF, Word, Excel, ຮູບພາບ)</p>
            </div>
          </div>
        </Card>

        {/* System Information Card */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <span>ຂໍ້ມູນລະບົບ & ເວີຊັນ (System Version Info)</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50/70 border border-blue-200/90 shadow-2xs">
              <p className="text-slate-500 font-medium">ເວີຊັນລ່າສຸດ (Version)</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black font-mono text-blue-700">V02</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white shadow-2xs">LATEST</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">ເວີຊັນ Version V02 (Enterprise)</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200/90 shadow-2xs">
              <p className="text-slate-500 font-medium">ສະຖານະລະບົບ (Status)</p>
              <p className="text-base font-bold text-emerald-700 mt-1">🟢 Online 24/7 ພ້ອມໃຊ້ງານ</p>
              <p className="text-[11px] text-emerald-600/80 mt-1 font-medium">Cloud Edge Network & SSL Active</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50/70 border border-indigo-200/90 shadow-2xs">
              <p className="text-slate-500 font-medium">ສະຖາປັດຕະຍະກຳ (Architecture)</p>
              <p className="text-base font-bold text-indigo-900 mt-1">Full-Stack Enterprise</p>
              <p className="text-[11px] text-indigo-600/80 mt-1 font-medium">React 18 + Node Express + SQLite</p>
            </div>
          </div>
        </Card>

        {/* Save Button Bar */}
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="lg" isLoading={loading}>
            <Save className="w-4 h-4 mr-2" />
            ບັນທຶກການຕັ້ງຄ່າທັງໝົດ
          </Button>
        </div>
      </form>
    </div>
  );
};
