import { MessageCircle, Code2, Zap, Github, Globe } from 'lucide-react';
import tanjiroImg from '@/assets/tanjiro_ai.png';

const WHATSAPP_URL = 'https://wa.me/2349120185747';

export default function DeveloperProfile() {
  return (
    <div className="dev-profile-card">
      {/* Ambient glow blobs */}
      <div className="dev-glow-violet" />
      <div className="dev-glow-cyan" />

      {/* Avatar */}
      <div className="dev-avatar-wrap">
        <div className="dev-avatar-ring">
          <img
            src={tanjiroImg}
            alt="Dev Daminī — Tanjiro"
            className="dev-avatar-img"
            onError={(e) => {
              const t = e.currentTarget as HTMLImageElement;
              t.style.display = 'none';
            }}
          />
        </div>
        <span className="dev-online-dot" />
      </div>

      {/* Name & title */}
      <div className="dev-identity">
        <span className="dev-tag">DEV_ID</span>
        <h3 className="dev-name">Dev Daminī</h3>
        <p className="dev-role">Full-Stack · API Architect</p>
        <p className="dev-org">Damini Codesphere</p>
      </div>

      {/* Skill chips */}
      <div className="dev-chips">
        {[
          { icon: Code2, label: 'TypeScript' },
          { icon: Zap, label: 'API Expert' },
          { icon: Globe, label: 'Cloud Native' },
        ].map(({ icon: Icon, label }) => (
          <span key={label} className="dev-chip">
            <Icon style={{ width: 10, height: 10 }} />
            {label}
          </span>
        ))}
      </div>

      {/* Status bar */}
      <div className="dev-status">
        <span className="dev-status-dot" />
        <span className="dev-status-text">Online · Available</span>
      </div>

      {/* CTA */}
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="dev-cta">
        <MessageCircle style={{ width: 14, height: 14 }} />
        WhatsApp Contact
      </a>
    </div>
  );
}
