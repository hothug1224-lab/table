import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Spinner, ErrorAlert } from '../../components/ui/Common';

const STATUS_COLOR = {
  AVAILABLE: 'bg-green-100 border-green-400 text-green-800',
  OCCUPIED: 'bg-red-100 border-red-400 text-red-800',
  RESERVED: 'bg-amber-100 border-amber-400 text-amber-800',
  MAINTENANCE: 'bg-gray-200 border-gray-400 text-gray-500'
};

export default function FloorPlanPage() {
  const toast = useToast();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => api.get('/tables')
    .then((r) => setTables(r.data.data))
    .catch((e) => setError(getErrorMessage(e)))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // Positions are relative to a zone. Offset each zone into its own area so
  // tables from different zones never render on top of one another.
  const zoneLayouts = Array.from(
    new Set(tables.map((table) => table.zone?.name || 'Unassigned'))
  ).map((name, index) => ({
    name,
    left: (index % 2) * 720,
    top: Math.floor(index / 2) * 360
  }));
  const zoneLayoutByName = new Map(zoneLayouts.map((zone) => [zone.name, zone]));

  const cycleStatus = async (t) => {
    const order = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'];
    const next = order[(order.indexOf(t.status) + 1) % order.length];
    try {
      await api.patch(`/tables/${t.id}/status`, { status: next });
      setTables((rows) => rows.map((x) => x.id === t.id ? { ...x, status: next } : x));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <Spinner />;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">ผังโต๊ะ</h1>
      <p className="text-sm text-gray-500 mb-6">คลิกที่โต๊ะเพื่อเปลี่ยนสถานะ</p>
      <ErrorAlert message={error} />
      <div className="overflow-auto rounded-xl border bg-gray-50">
        <div className="relative min-w-[1440px] min-h-[720px] bg-white">
        {zoneLayouts.map((zone) => (
          <div key={zone.name} aria-hidden="true"
               style={{ left: zone.left + 16, top: zone.top + 12, position: 'absolute' }}
               className="text-sm font-semibold text-gray-500">
            {zone.name}
          </div>
        ))}
        {tables.map((t) => (
          <button key={t.id} onClick={() => cycleStatus(t)}
                  style={{
                    left: (zoneLayoutByName.get(t.zone?.name || 'Unassigned')?.left || 0) + t.posX,
                    top: (zoneLayoutByName.get(t.zone?.name || 'Unassigned')?.top || 0) + t.posY,
                    position: 'absolute'
                  }}
                  className={`w-32 min-h-24 p-2 rounded-lg border-2 text-center text-xs leading-5
                              ${STATUS_COLOR[t.status]}`}>
            <div className="font-semibold">{t.tableNo}</div>
            <div>{t.seats} ที่นั่ง · {t.zone?.name}</div>
            <div className="mt-1 font-medium">{t.status}</div>
          </button>
        ))}
        </div>
      </div>
    </main>
  );
}
