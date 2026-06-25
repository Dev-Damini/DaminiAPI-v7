import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Zap, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "[Daminī API] 404 — Route not found:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen canvas-bg grid-line-bg flex items-center justify-center px-4">
      <div className="glass-panel rounded-2xl p-10 max-w-md w-full text-center violet-glow-shadow border border-violet-500/20">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <p className="text-6xl font-bold neon-text-violet mono mb-2">404</p>
        <h1 className="text-lg font-bold text-white mb-2">Route Not Found</h1>
        <p className="text-sm text-muted-foreground mb-1 font-mono break-all">
          {location.pathname}
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          This endpoint does not exist in the Daminī API cockpit.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-violet-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Cockpit
        </a>
      </div>
    </div>
  );
};

export default NotFound;
