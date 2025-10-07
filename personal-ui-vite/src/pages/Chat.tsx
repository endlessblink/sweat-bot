import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SweatBotChat from '../components/SweatBotChat';
import { getUsername, isGuestUser, clearAuth } from '../utils/auth';
import { designTokens } from '../design-system/tokens';
import { Button, Badge } from '../design-system/components/base';
import StatsPanel from '../components/ui/StatsPanel';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const SUGGESTIONS = [
  'ספר לי איך להתאמן 5 דקות',
  'האם יש לי נקודות חדשות?',
  'הצע לי אימון HIIT קצר',
  'תזכיר לי לשתות מים בכל שעה'
];

const HERO_CARDS = [
  {
    title: 'אימון מהיר',
    description: 'תוכנית קצרה של 5 דקות ללא ציוד.',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
  },
  {
    title: 'מעקב נקודות',
    description: 'צפה בהתקדמות ובזכיות שלך.',
    gradient: 'linear-gradient(135deg, #22D3EE 0%, #6366F1 100%)',
  },
  {
    title: 'שליטה קולית',
    description: 'תעד אימונים בעברית מבלי לגעת במסך.',
    gradient: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
  },
  {
    title: 'היעדים שלי',
    description: 'נהל יעדים שבועיים וחודשייים באפליקציה.',
    gradient: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
  }
];

export default function Chat() {
  const navigate = useNavigate();
  const username = getUsername();
  const isGuest = isGuestUser();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [clearChatFn, setClearChatFn] = useState<(() => void) | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    const handler = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const container = chatContainerRef.current;
    if (!container) return;

    const onTouchStart = (event: TouchEvent) => {
      touchStartX.current = event.touches[0]?.clientX ?? 0;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
      if (Math.abs(delta) < 60) return;
      if (delta > 0) {
        setHistoryOpen(true);
        setStatsOpen(false);
      } else {
        setStatsOpen(true);
        setHistoryOpen(false);
      }
    };

    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const statsPanelControl = useMemo(() => ({
    isOpen: statsOpen,
    setIsOpen: setStatsOpen
  }), [statsOpen]);

  const historyPanelControl = useMemo(() => ({
    isOpen: historyOpen,
    setIsOpen: setHistoryOpen
  }), [historyOpen]);

  const renderSuggestionChips = () => (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: designTokens.spacing[2],
      marginTop: designTokens.spacing[3]
    }}>
      {SUGGESTIONS.map((text) => (
        <button
          key={text}
          onClick={() => setHistoryOpen(false)}
          className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs hover:bg-neutral-800 transition-colors"
        >
          {text}
        </button>
      ))}
    </div>
  );

  // ----- Mobile Layout -----
  if (!isDesktop) {
    return (
      <div
        ref={chatContainerRef}
        style={{
          minHeight: '100vh',
          backgroundColor: designTokens.colors.background.primary,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <header style={{
          padding: designTokens.spacing[4],
          borderBottom: `1px solid ${designTokens.colors.border.primary}`,
          backgroundColor: designTokens.colors.background.secondary
        }}>
          <h1 style={{
            fontSize: designTokens.typography.fontSize.xl,
            fontWeight: designTokens.typography.fontWeight.bold,
            color: designTokens.colors.text.primary,
            margin: 0
          }}>
            💪 SweatBot
          </h1>
          {username && (
            <div style={{ marginTop: designTokens.spacing[2] }}>
              <Badge variant={isGuest ? 'default' : 'primary'}>
                {isGuest ? '👤 אורח' : `🔐 ${username}`}
              </Badge>
            </div>
          )}
        </header>

        <main style={{ flex: 1, padding: designTokens.spacing[2] }}>
          <SweatBotChat
            hideHeader
            onRegisterClearChat={(fn) => setClearChatFn(() => fn)}
            statsPanelControl={statsPanelControl}
            historyPanelControl={historyPanelControl}
          />
        </main>

        <footer style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: designTokens.colors.background.secondary,
          borderTop: `1px solid ${designTokens.colors.border.default}`,
          padding: designTokens.spacing[3],
          display: 'flex',
          gap: designTokens.spacing[2],
          flexWrap: 'wrap'
        }}>
          <Button variant="ghost" onClick={() => setHistoryOpen(true)} fullWidth>
            📜 היסטוריה
          </Button>
          <Button variant="ghost" onClick={() => setStatsOpen(true)} fullWidth>
            📊 סטטיסטיקות
          </Button>
          {installPrompt && (
            <Button variant="secondary" onClick={handleInstall} fullWidth>
              📲 התקן אפליקציה
            </Button>
          )}
          <Button
            variant="danger"
            onClick={() => clearChatFn?.()}
            fullWidth
            disabled={!clearChatFn}
          >
            🧹 נקה שיחה
          </Button>
        </footer>
      </div>
    );
  }

  // ----- Desktop Layout -----
  const heroCardStyle = (gradient: string): React.CSSProperties => ({
    flex: '1 1 200px',
    minWidth: '200px',
    padding: designTokens.spacing[4],
    borderRadius: designTokens.borderRadius.lg,
    background: gradient,
    color: designTokens.colors.text.primary,
    display: 'flex',
    flexDirection: 'column',
    gap: designTokens.spacing[2]
  });

  const leftRail = (
    <aside style={{
      width: '260px',
      background: designTokens.colors.background.secondary,
      padding: designTokens.spacing[4],
      borderRadius: designTokens.borderRadius.lg,
      border: `1px solid ${designTokens.colors.border.subtle}`,
      display: 'flex',
      flexDirection: 'column',
      gap: designTokens.spacing[4],
      height: 'calc(100vh - 64px)',
      position: 'sticky',
      top: designTokens.spacing[4]
    }}>
      <div>
        <h2 style={{
          fontSize: designTokens.typography.fontSize.lg,
          color: designTokens.colors.text.primary,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: designTokens.spacing[2]
        }}>
          <span role="img" aria-label="dumbbell">🏋️‍♂️</span> SweatBot
        </h2>
        <p style={{
          margin: `${designTokens.spacing[2]} 0 0`,
          color: designTokens.colors.text.secondary,
          fontSize: designTokens.typography.fontSize.sm
        }}>
          Fast • Hebrew-first coach
        </p>
      </div>

      <div>
        <input
          placeholder="חפש שיחה"
          style={{
            width: '100%',
            background: designTokens.colors.background.primary,
            border: `1px solid ${designTokens.colors.border.default}`,
            borderRadius: designTokens.borderRadius.md,
            padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
            color: designTokens.colors.text.primary
          }}
        />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing[2] }}>
        {['דף הבית', 'שיחה', 'ספריית פרומפטים', 'אינטגרציות'].map((item, idx) => (
          <button
            key={item}
            className={`text-right px-3 py-2 rounded-md transition-colors ${idx === 1 ? 'bg-neutral-800 text-white' : 'bg-transparent text-neutral-400 hover:bg-neutral-900'}`}
          >
            {item}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1, overflow: 'hidden auto' }}>
        <h4 style={{ color: designTokens.colors.text.secondary, fontSize: designTokens.typography.fontSize.sm }}>Pinned</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing[2], marginTop: designTokens.spacing[2] }}>
          {['Healthy Habits', 'Weekly Workout', 'Stretch Routine'].map((item) => (
            <button key={item} className="text-right px-3 py-2 rounded-md bg-neutral-900 text-neutral-300 hover:bg-neutral-800 transition-colors">
              {item}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
        background: 'rgba(99,102,241,0.15)',
        borderRadius: designTokens.borderRadius.md
      }}>
        <span style={{ color: designTokens.colors.text.primary, fontSize: designTokens.typography.fontSize.sm }}>שדרג לגרסה מלאה</span>
        <Button variant="primary" size="sm">שדרג</Button>
      </div>
    </aside>
  );

  const utilityPanel = (
    <aside style={{
      width: '300px',
      display: 'flex',
      flexDirection: 'column',
      gap: designTokens.spacing[4],
      position: 'sticky',
      top: designTokens.spacing[4]
    }}>
      <div style={{
        background: designTokens.colors.background.secondary,
        borderRadius: designTokens.borderRadius.lg,
        border: `1px solid ${designTokens.colors.border.subtle}`,
        padding: designTokens.spacing[4]
      }}>
        <h3 style={{
          color: designTokens.colors.text.primary,
          margin: `0 0 ${designTokens.spacing[3]}`
        }}>📊 סטטיסטיקות מהירות</h3>
        <StatsPanel onClose={() => setStatsOpen(false)} />
      </div>

      <div style={{
        background: designTokens.colors.background.secondary,
        borderRadius: designTokens.borderRadius.lg,
        border: `1px solid ${designTokens.colors.border.subtle}`,
        padding: designTokens.spacing[4],
        display: 'flex',
        flexDirection: 'column',
        gap: designTokens.spacing[2]
      }}>
        <h3 style={{ color: designTokens.colors.text.primary, margin: 0 }}>📲 התקן את SweatBot</h3>
        <p style={{ color: designTokens.colors.text.secondary, fontSize: designTokens.typography.fontSize.sm }}>
          גש לאימונים מתוך מסך הבית שלך. אין צורך בחנויות אפליקציות.
        </p>
        <Button variant="secondary" onClick={handleInstall} disabled={!installPrompt}>
          הורד כאפליקציה
        </Button>
      </div>
    </aside>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: designTokens.colors.background.primary,
      padding: designTokens.spacing[4]
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        gap: designTokens.spacing[4]
      }}>
        {leftRail}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: designTokens.spacing[4] }}>
          <section style={{
            background: designTokens.colors.background.secondary,
            borderRadius: designTokens.borderRadius.lg,
            border: `1px solid ${designTokens.colors.border.subtle}`,
            padding: `${designTokens.spacing[5]} ${designTokens.spacing[6]}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: designTokens.spacing[4] }}>
              <div>
                <h1 style={{
                  fontSize: designTokens.typography.fontSize['3xl'],
                  color: designTokens.colors.text.primary,
                  margin: 0
                }}>
                  ברוך הבא ל‑SweatBot
                </h1>
                <p style={{
                  margin: `${designTokens.spacing[2]} 0 0`,
                  color: designTokens.colors.text.secondary
                }}>
                  המאמן הדיגיטלי שלך לתיעוד אימונים, סטטיסטיקות ויעדים.
                </p>
              </div>
              <div style={{ display: 'flex', gap: designTokens.spacing[2] }}>
                <Button variant="ghost" onClick={() => setHistoryOpen(true)}>📜 היסטוריה</Button>
                <Button variant="ghost" onClick={() => setStatsOpen(true)}>📊 סטטיסטיקות</Button>
                <Button variant="danger" onClick={() => clearChatFn?.()} disabled={!clearChatFn}>🧹 נקה</Button>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: designTokens.spacing[3],
              marginTop: designTokens.spacing[5]
            }}>
              {HERO_CARDS.map((card) => (
                <div key={card.title} style={heroCardStyle(card.gradient)}>
                  <h3 style={{ margin: 0, fontSize: designTokens.typography.fontSize.lg }}>{card.title}</h3>
                  <p style={{ margin: 0, color: designTokens.colors.text.primary }}>{card.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section style={{
            background: 'radial-gradient(circle at top, rgba(99,102,241,0.1), transparent)',
            borderRadius: designTokens.borderRadius.xl,
            border: `1px solid ${designTokens.colors.border.default}`,
            padding: designTokens.spacing[4]
          }}>
            {renderSuggestionChips()}
            <div style={{
              marginTop: designTokens.spacing[4],
              borderRadius: designTokens.borderRadius.lg,
              border: `1px solid ${designTokens.colors.border.subtle}`,
              background: designTokens.colors.background.primary,
              overflow: 'hidden'
            }}>
              <SweatBotChat
                hideHeader
                onRegisterClearChat={(fn) => setClearChatFn(() => fn)}
                statsPanelControl={statsPanelControl}
                historyPanelControl={historyPanelControl}
              />
            </div>
          </section>
        </div>

        {utilityPanel}
      </div>
    </div>
  );
}
