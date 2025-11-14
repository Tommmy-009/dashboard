import { useEffect, useState } from "react";
import ServiceCard from "./components/ServiceCard";

const SERVICES = [
  {
    name: "Cloudflare Tunnel",
    icon: "☁️",
    url: "https://dash.cloudflare.com/d282e15500a533d262c8610cb7b2a6dc",
    description: "Tunnels & DNS",
  },
  {
    name: "Home Assistant",
    icon: "🏠",
    url: "http://192.168.1.55:8123",
    description: "Domotica & sensori",
  },
  {
    name: "Docker UI",
    icon: "🐳",
    url: "https://192.168.1.55:9443",
    description: "Gestione immagini e stack",
  },
  {
    name: "Dashboard",
    icon: "🖥️",
    url: "https://dashboard.home-servis.nl",
    description: "Gestione server e terminale"
  },
];

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login';
}

export default function App() {
  const [statuses, setStatuses] = useState({});
  const [stats, setStats] = useState(null);

  const checkServices = async () => {
    const newStatuses = {};
    for (const s of SERVICES) {
      if (s.name === "Dashboard") { newStatuses[s.name] = true; continue; }
      try {
        const res = await fetch(s.url, { method: "HEAD", mode: "no-cors" });
        newStatuses[s.name] = res.ok || res.type === "opaque" || res.status === 0;
      } catch { newStatuses[s.name] = false; }
    }
    setStatuses(newStatuses);
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.ok) setStats(data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    checkServices();
    loadStats();
    const id1 = setInterval(checkServices, 10000);
    const id2 = setInterval(loadStats, 10000);
    return () => { clearInterval(id1); clearInterval(id2); };
  }, []);

  return (
    <div className="relative min-h-screen text-white">
      {/* background */}
      <div className="absolute inset-0 -z-10 bg-[#0b1020]" />
      <div className="absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(1200px 800px at 20% 10%, rgba(78,70,221,0.25), transparent 60%), radial-gradient(1000px 700px at 80% 90%, rgba(147,51,234,0.20), transparent 60%)' }} />

      {/* header */}
      <header className="sticky top-0 z-10 backdrop-blur-lg bg-white/5 border-b border-white/10 shadow-glass">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🧩</div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Home Server Control Hub</h1>
              <p className="text-xs text-violet-300/80">Liquid Glass • Dark</p>
            </div>
          </div>
          <button onClick={logout}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20">
            Esci
          </button>
        </div>
      </header>

      {/* stats bar */}
      {stats && (
        <div className="mx-auto max-w-6xl px-5 mt-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-glass p-4 text-sm grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>💻 <span className="text-white/70">CPU</span>: {stats.cpuLoad}%</div>
            <div>🌡️ <span className="text-white/70">Temp</span>: {stats.temp ?? 'N/A'}{stats.temp ? ' °C' : ''}</div>
            <div>🧠 <span className="text-white/70">RAM</span>: {stats.memUsedPct}%</div>
            <div>💾 <span className="text-white/70">Disco</span>: {stats.diskUsedPct ?? 'N/A'}%</div>
            <div>🕒 <span className="text-white/70">Uptime</span>: {stats.uptimeMin} min</div>
          </div>
        </div>
      )}

      {/* grid */}
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <ServiceCard key={s.name} {...s} online={statuses[s.name]} />
          ))}
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-5 pb-10 text-sm text-white/70">© Tommy</footer>
    </div>
  );
}
