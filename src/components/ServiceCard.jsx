export default function ServiceCard({ name, icon, description, url, online }) {
  const isOnline = !!online;
  const statusText = isOnline ? "Online" : "Offline";

  const glow = isOnline
    ? "bg-emerald-500/70 shadow-[0_0_12px_2px_rgba(16,185,129,0.6)]"
    : "bg-rose-500/70 shadow-[0_0_12px_2px_rgba(244,63,94,0.6)]";

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-glass transition-transform hover:-translate-y-0.5"
    >
      <div className="relative p-6">
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className="text-lg font-semibold mb-1">{name}</h2>
        <p className="text-sm text-white/70 mb-5 group-hover:text-white/90 transition-colors">
          {description}
        </p>

        <div className="flex items-center gap-2">
          {/* Pallino luminoso animato */}
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOnline ? "bg-emerald-400" : "bg-rose-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${glow}`}
            ></span>
          </span>

        <span className="text-sm font-medium">{statusText}</span>
        </div>
      </div>
    </a>
  );
}
