/* eslint-disable no-undef */
/* eslint-env browser */
/* eslint-disable no-unused-vars, no-empty */
import { useState, useEffect, useRef } from "react";
// import { createPortal } from 'react-dom'; // unused
// import { useAuth } from './AuthContext.jsx'; // unused
import { useNavigate } from 'react-router-dom';
import { getTranslation } from './translations.js';
import { useLanguage } from './LanguageContext.jsx';
import FreeRequestSubmittedModal from './FreeRequestSubmittedModal.jsx';
import BoostsModal from './BoostsModal.jsx';
import SharedBottomBar from './components/SharedBottomBar.jsx';
import {
  Home,
  Pencil,
  MoreHorizontal,
  MoveLeft,
  ChevronRight,
  User,
  ArrowRight,
  FileText,
  Clock,
  Check,
  Lightbulb,
  Film,
  Repeat,
  ListVideo,
  Folder,
  Settings,
  DollarSign,
  Briefcase,
  Coffee,
  TrendingUp,
  Smile,
  Heart,
  BookOpen,
  Crown,
  Link as LinkIcon,
  Globe,
  EyeOff,
  Lock,
  Calendar,
  X,
  MessageCircle,
  Zap,
  Bookmark,
  MessageSquare,
  ChevronsUp,
  Pin,
  HeartOff,
  Flag,
  Share2,
  Shield,
  Target,
  Palette,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
  AlertCircle,
} from "lucide-react";


// Inlined theme CSS (previously in theme.js) to make this file self-contained
const THEME_CSS = `:root {
  --brand-gold: #ca8a04;
  --brand-gold-600: #B27000;
  --brand-gold-700: #8F5900;
  --brand-gold-soft: rgba(203,138,0,0.12);
  --brand-gold-light: rgba(203,138,0,0.4);
/* Focused input inside provider chooser: subtle thin gold glow */
.provider-card input:focus, .creator-search-input:focus {
    outline: none;
    border-color: var(--brand-gold-600);
    0% { box-shadow: 0 12px 28px rgba(6,24,58,0.10); }
    50% { box-shadow: 0 18px 40px rgba(6,24,58,0.12); }
    100% { box-shadow: 0 12px 28px rgba(6,24,58,0.10); }
}
.provider-card.selected { animation: card-subtle-pulse 1000ms ease-out; }

/* Edge fade removed for choose creator list clarity */
.provider-carousel-wrap { position: relative; }
.provider-carousel-wrap::before, .provider-carousel-wrap::after {
    display: none !important;
}

/* Hide temporary rebuilt chooser to avoid duplicates */
.choose-creator-new { display: none !important; }

/* Expanded provider card (choose creator) */
.provider-card.expanded { min-height: 180px; }
/* Expanded body: fade + slight lift for a smooth premium feel */
.provider-card .expanded-body {
    max-height: 560px;
    overflow: hidden;
    opacity: 0;
    transform: translateY(-6px);
    transition: max-height 320ms ease, opacity 260ms ease, transform 260ms cubic-bezier(0.22,1,0.36,1);
}
.provider-card.expanded .expanded-body {
    opacity: 1;
    transform: translateY(0);
}
/* Unified Search Bar Container - Following home.jsx pattern */

.creator-search-row {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    border: 1px solid rgba(15,23,42,0.1);
    border-radius: 12px;
    padding: 10px 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    transition: all 0.2s ease;
    margin-bottom: 16px;
}
.creator-search-row:focus-within {
    border-color: var(--brand-gold-600);
    box-shadow: 0 4px 16px rgba(203,138,0,0.12);
}

/* Input Wrapper */
.creator-search-input-wrap {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    min-width: 0;
}

/* Prefix @ */
.creator-search-prefix {
    position: absolute;
    left: 6px; /* Nudge inward */
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    font-weight: 600;
    color: rgba(15,23,42,0.4);
    pointer-events: none;
    z-index: 2;
}

/* Input Field - EXACT copy of home.jsx pattern */
.creator-search-input {
    flex: 1;
    background: transparent !important;
    border: none !important;
    outline: none !important;
    padding: 0 0 0 24px !important;
    font-size: 15px !important;
    font-weight: 500 !important;
    color: #000000 !important; /* Force black */
    min-width: 0 !important;
    height: 24px !important; /* Fixed height to ensure visibility */
    line-height: 24px !important; /* Center text vertically */
    box-shadow: none !important;
    border-radius: 0 !important;
    width: auto !important;
    max-width: none !important;
    caret-color: #000000 !important;
    -webkit-text-fill-color: #000000 !important;
    z-index: 10 !important;
    position: relative !important;
}
.creator-search-input::placeholder { 
    color: #000000 !important; 
    opacity: 0.5 !important;
}

/* Clear X Button */
.creator-search-clear {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(15,23,42,0.5);
    cursor: pointer;
    transition: all 0.15s;
}
.creator-search-clear:hover { 
    background: rgba(15,23,42,0.06); 
    color: #ef4444; 
}

/* Save Button */
.creator-search-save {
    flex-shrink: 0;
    height: 32px;
    padding: 0 14px;
    border-radius: 8px;
    background: var(--color-primary);
    color: #fff;
    border: none;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.creator-search-save:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(122,58,240,0.25);
}

/* Make selected pill not overlap the input */
.creator-selected-pill { display: inline-block; margin-bottom: 8px !important; background: transparent !important; color: #0f172a !important; z-index: 220 !important; }

/* Force overflow visible to allow dropdown bleeding and ensure layering */
.provider-carousel-wrap,
.provider-carousel,
.provider-card,
.provider-card.expanded,
.expanded-body,
.provider-card .expanded-body {
    overflow: visible !important;
}

/* Ensure the expanded card floats above siblings (preventing next card from covering the dropdown) */
.provider-card.expanded {
    z-index: 60;
    position: relative;
    border-color: transparent; /* remove inner white border */
    background: transparent; /* let modal background show through */
    box-shadow: none;
}

/* Ensure non-expanded cards stay below */
.provider-card:not(.expanded) {
    z-index: 1;
}

/* Remove any pseudo-element overlays or fades that could cloud content */
.provider-card::before,
.provider-card::after,
.provider-card .card-info::before,
.provider-card .card-info::after,
.provider-carousel-wrap::before,
.provider-carousel-wrap::after {
    display: none !important;
    content: none !important;
}

/* Ensure the selected pill is fully visible and readable */
.creator-selected-pill {
    position: relative;
    z-index: 999 !important;
    box-shadow: 0 2px 6px rgba(6,24,58,0.08) !important;
    background: #374151 !important; /* dark gray */
    border: 1px solid rgba(0,0,0,0.12) !important;
    color: #ffffff !important; /* white text for contrast */
    font-weight: 700 !important;
    padding: 6px 10px !important;
    margin-bottom: 8px !important;
    border-radius: 9999px !important;
    font-size: 13px !important;
    display: inline-block;
    line-height: 1 !important;
}

/* Card header styling - ensure title/sub are visible */
.provider-card .card-info,
.provider-card .card-title,
.provider-card .card-sub {
    background: transparent !important;
    box-shadow: none !important;
    position: relative;
    z-index: 2 !important;
    pointer-events: auto !important;
}

.provider-card .card-title {
    color: #0f172a !important;
    font-weight: 700 !important;
    font-size: 14px !important;
}
.provider-card .card-sub {
    color: #6b7280 !important;
    font-size: 12px !important;
}

/* Ensure expanded body and search row sit above card header */
.expanded-body {
    position: relative;
    z-index: 100 !important;
    background: transparent !important;
}

.creator-search-row {
    position: relative;
    z-index: 101 !important;
    background: transparent !important;
}

/* Input wrapper: keep relative and reserve space for clear button */
.creator-search-input-wrap {
    position: relative;
    z-index: 102 !important;
    background: transparent !important;
    flex: 1 1 auto;
    min-width: 0;
    padding-right: 0; /* Handled dynamically via inline style */
}

/* Clear button position adjusted so it doesn't overlap Save */
.creator-search-clear {
    position: absolute;
    right: 12px; /* inside the input wrap */
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(15,23,42,0.5);
    cursor: pointer;
    z-index: 110;
}

/* Ensure Save button sits to the right of the input and has margin */
.creator-search-save {
    margin-left: 8px !important;
}

/* Force the card-info to not overflow or cover expanded content */
.provider-card.expanded .card-info {
    position: static !important;
    overflow: visible !important;
    max-height: none !important;
}


/* Expanded List Area - The "Dropdown Card" */
.choose-creator-list {
    position: relative; /* Back to relative to avoid clipping issues */
    margin-left: 0;
    margin-right: 0;
    width: 100%;
    max-height: 320px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    margin-top: 12px;
    background: transparent;
    border-top: none;
    border-bottom: none;
    box-shadow: none;
    border-radius: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    z-index: 100;
}

/* Ensure the container is relative so absolute positioning works relative to it */
.creator-search-row {
    /* ... existing styles ... */
    z-index: 51; /* Search bar above dropdown */
    margin-bottom: 0; /* Connect to the list */
}

/* Fix input visibility */
.creator-search-input {
    color: #0f172a !important; /* Force dark color */
    opacity: 1 !important;
}

/* List Item */
.creator-row {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(15,23,42,0.04);
    background: transparent;
    border-radius: 0;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background 0.15s ease;
    cursor: pointer;
}
.creator-row:last-child { border-bottom: none; }
.creator-row:hover {
    background: rgba(15,23,42,0.03);
    transform: none; /* remove scaling */
    box-shadow: none;
    z-index: 1;
}
.creator-row.selected {
    background: rgba(122,58,240,0.06);
    border-color: transparent;
    box-shadow: inset 3px 0 0 var(--color-primary); /* Left accent */
}

/* Avatar */
.creator-avatar {
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
    border-radius: 50% !important;
    margin-right: 12px;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    overflow: hidden;
    position: relative;
    display: flex; align-items: center; justify-content: center;
}
.creator-avatar img { width: 100%; height: 100%; object-fit: cover; }

.creator-name { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
.creator-display { font-weight: 600; color: #0f172a; font-size: 14px; line-height: 1.2; letter-spacing: -0.01em; }
.creator-role-label { font-size: 12px; color: #64748b; font-weight: 500; }

/* Clear button inside input */
.input-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: rgba(15,23,42,0.5);
    padding: 6px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 140ms ease, color 140ms ease;
}
.input-clear:hover { background: rgba(15,23,42,0.03); color: rgba(15,23,42,0.7); }

/* Close button inside focused header */
.close-focus-btn { color: rgba(15,23,42,0.6); padding: 6px; border-radius: 8px; display:inline-flex; align-items:center; justify-content:center; }
.close-focus-btn:hover { background: rgba(15,23,42,0.03); color: rgba(15,23,42,0.9); }
        /* Position the close button inside the focused card */
        .provider-card.focused-card .close-focus-btn {
          position: absolute;
          right: 12px;
          top: 12px;
          z-index: 30;
          background: transparent;
          color: rgba(15,23,42,0.6);
        }

/* No-results premium styling */
.no-results { color: var(--muted); will-change: opacity, transform; animation: fade-scale 320ms cubic-bezier(0.22,1,0.36,1) both; }
.no-results-illustration svg { width: 72px; height: 72px; display: block; }
.no-results-title { color: var(--deep-navy); }
.no-results-sub { color: #9CA3AF; }

/* Fade + gentle scale entrance for premium feel */
@keyframes fade-scale {
    0% { opacity: 0; transform: scale(0.98) translateY(-6px); }
    60% { opacity: 1; transform: scale(1.01) translateY(0); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* Input prefix styling removed (unused) */

/* Styles removed to fix conflict with unified search bar */

/* Mobile optimizations for search bar */
@media (max-width: 640px) {
    .creator-search-row {
        padding-left: 10px !important;
        padding-right: 10px !important;
        gap: 6px !important;
    }
    .creator-search-save {
        padding-left: 8px !important;
        padding-right: 8px !important;
        font-size: 13px !important;
        height: 32px !important;
        margin-left: 0 !important; /* Save space */
    }
    .creator-search-input {
        font-size: 14px !important;
        padding-left: 22px !important; /* Slightly reduce left padding for @ */
    }
}

/* Preset most-popular badge */
.most-popular-badge {
    position: absolute;
    top: -8px;
    right: -8px; /* push outside the button so it doesn't overlap the amount */
    background: var(--brand-gold-600);
    color: var(--on-gold);
    font-weight: 700;
    font-size: 9px; /* smaller */
    padding: 3px 6px; /* smaller */
    border-radius: 9999px;
    box-shadow: 0 6px 16px rgba(203,138,0,0.06);
    z-index: 3;
}

/* Refund modal styles removed (UI simplified) */

/* Preset button helpers for spacing and premium feel */
.preset-btn { min-width: 88px; display: inline-flex; align-items: center; justify-content: center; padding-left: 18px; padding-right: 18px; border-radius: 14px; }

/* Creator selected pill (override duplicate) */
.creator-selected-pill {
    display: inline-block;
    padding: 6px 10px !important;
    background: #333333 !important; /* Dark grey */
    border-radius: 9999px;
    font-size: 13px !important;
    color: #ffffff !important; /* Force white text */
    font-weight: 700 !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.12) !important;
}

/* --- Preview Card Responsive Fixes ---
   Keeps footer icons (bookmark/lightbulb) within the card on small screens
*/
.preview-card { overflow: visible; }

@media (max-width: 640px) {
    /* Reduce right padding so icons sit inside rounded edge */
    .preview-card { padding-right: 20px !important; }

    /* Nudge footer icons slightly toward the card edge so they visually sit on the rounded boundary */
    .preview-footer-icons { margin-right: -8px; }

    /* Inline (step-6) preview needs a stronger nudge than modal so there's more distance from the boosts icon */
    .inline-preview-footer-icons { margin-right: -51px; }

    /* Make footer icon buttons slightly smaller so they don't overflow */
    .preview-footer-icons > div {
        padding: 6px !important;
        min-width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .preview-footer-icons svg {
        width: 16px !important;
        height: 16px !important;
    }

    /* Slightly stronger nudge on very small phones */
    @media (max-width: 420px) {
        .preview-footer-icons { margin-right: -10px; }
        .inline-preview-footer-icons { margin-right: -59px; }
        .claim-button { right: 6px !important; }
    }

    /* Keep the rotated CLAIM tab inside the card on small widths */
    .claim-button { right: 8px !important; }
}

`;

// Small helper to read CSS variables (used throughout this file)
const getCssVar = (name, fallback) => {
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue(name);
    return val ? val.trim() : (fallback || '');
  } catch (e) {
    return fallback || '';
  }
};

// --- Footer copied from home.jsx (BottomBar) and adapted ---
// MobileNav is now using SharedBottomBar from components/SharedBottomBar.jsx
const MobileNav = ({ selectedLanguage = 'English' }) => {
  return <SharedBottomBar selectedLanguage={selectedLanguage} activeTabOverride="Ideas" />;
};

// --- Reusable Component for Sponsor/Success Confirmation (Extracted from Series) ---
const SponsorConfirmation = ({ selectedLanguage = 'English' }) => {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setShowToast(true);
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8">
      {/* Confetti Overlay */}
      {showToast && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                width: "8px",
                height: "8px",
                backgroundColor: [
                  "#FFD700",
                  "#FF6B6B",
                  "#4ECDC4",
                  "#45B7D1",
                  "#96CEB4",
                ][Math.floor(Math.random() * 5)],
                animation: `confetti-fall ${2 + Math.random() * 3
                  }s linear forwards`,
                animationDelay: `${Math.random() * 2}s`,
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
              }}
            />
          ))}
        </div>
      )}

      {/* Toast confirmation removed from this component to avoid referencing App-level state */}

      {/* Refund details removed per request (UI simplified) */}

      {/* Toast Notification - Updated to match "Language Updated" style */}
      <div
        className={`
                    fixed left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm
                    bg-[var(--surface)] px-4 py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100
                    flex items-start space-x-3 z-50 transition-all duration-500
                    ${showToast
            ? "translate-y-0 opacity-100"
            : "-translate-y-20 opacity-0"
          }
                `}
        style={{ top: 'calc(12px + env(safe-area-inset-top, 0px))' }}
      >
        <div className="bg-green-500 rounded-full p-1 flex-shrink-0 mt-0.5">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-gray-900 leading-tight">
            {getTranslation('Request Created', selectedLanguage)}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5 leading-tight">
            {getTranslation('Your request has been successfully created.', selectedLanguage)}
          </p>
        </div>
        <button
          onClick={() => setShowToast(false)}
          className="text-gray-400 hover:text-gray-600 p-0.5 -mr-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Confirmation Text (Matches Image 47cb61.jpg / 52b869.jpg) */}
      <div className="flex items-center text-lg font-semibold text-gray-700">
        <Check className="w-5 h-5 mr-2 text-gold-small" />
        <span className="tracking-tight">{getTranslation('New options unlocked!', selectedLanguage)}</span>
      </div>

      {/* Sponsor Content Card */}
      <div className="relative rounded-xl cream-glow-box p-6 cursor-pointer hover:shadow-lg transition duration-200"
        role="button"
        tabIndex={0}
        onClick={() => { try { window.location.href = 'advertisewithus.jsx'; } catch (e) { } }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); try { window.location.href = 'advertisewithus.jsx'; } catch (err) { } } }}
        style={{
          background: "radial-gradient(circle at 12% 18%, rgba(var(--color-gold-rgb,203,138,0),0.16), rgba(var(--color-gold-rgb,203,138,0),0.04))",
          border: "1px solid rgba(var(--color-gold-rgb, 203,138,0), 0.22)",
          boxShadow: "inset 0 8px 24px rgba(var(--color-gold-rgb,203,138,0),0.05), 0 10px 30px rgba(6,24,58,0.06)",
          backgroundBlendMode: "screen, screen, normal, normal",
        }}
      >
        {/* scattered accent blobs (decorative, non-interactive) */}
        <span style={{ position: 'absolute', left: 12, top: 8, width: 44, height: 44, borderRadius: 9999, background: 'radial-gradient(circle, rgba(var(--color-gold-rgb,203,138,0),0.16), rgba(var(--color-gold-rgb,203,138,0),0.04))', filter: 'blur(10px)', opacity: 0.95, pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', right: 18, top: 28, width: 58, height: 58, borderRadius: 9999, background: 'radial-gradient(circle, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.03))', filter: 'blur(14px)', opacity: 0.9, pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', left: '38%', bottom: 6, width: 36, height: 36, borderRadius: 9999, background: 'radial-gradient(circle, rgba(var(--color-gold-rgb,203,138,0),0.10), rgba(var(--color-gold-rgb,203,138,0),0.02))', filter: 'blur(8px)', opacity: 0.95, pointerEvents: 'none' }} />
        <div className="flex items-start justify-between">
          <div className="flex items-center mb-4">
            <span className="p-3 rounded-full mr-4 text-[var(--color-gold)]"
              style={{
                background: "linear-gradient(135deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.06))",
                border: "1px solid rgba(var(--color-gold-rgb, 203,138,0), 0.12)",
                boxShadow: "inset 0 2px 6px rgba(var(--color-gold-rgb,203,138,0),0.06)",
              }}
            >
              <DollarSign className="w-6 h-6 text-[var(--color-gold)]" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                {getTranslation('Sponsor Content on Regaarder', selectedLanguage)}
              </h3>
              <p className="text-sm text-gray-500">{getTranslation('For brands & businesses', selectedLanguage)}</p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-[var(--color-gold)]" />
        </div>

        <p className="text-sm text-gray-700 mb-6">
          {getTranslation('Reach millions of engaged viewers through authentic creator partnerships. Tap here to explore our transparent sponsorship system.', selectedLanguage)}
        </p>

        <div className="flex flex-wrap gap-3">
          <span
            className="px-4 py-2 text-sm rounded-full font-medium text-[var(--color-gold)]"
            style={{
              background: "linear-gradient(180deg, rgba(var(--color-gold-rgb,203,138,0),0.06), var(--color-cream-bg))",
              border: "1px solid rgba(var(--color-gold-rgb,203,138,0),0.12)",
            }}
          >
            {getTranslation('Transparent Pricing', selectedLanguage)}
          </span>
          <span
            className="px-4 py-2 text-sm rounded-full font-medium text-[var(--color-gold)]"
            style={{
              background: "linear-gradient(180deg, rgba(var(--color-gold-rgb,203,138,0),0.06), var(--color-cream-bg))",
              border: "1px solid rgba(var(--color-gold-rgb,203,138,0),0.12)",
            }}
          >
            {getTranslation('Direct Brand-Creator Connection', selectedLanguage)}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Reusable Component for One-Time Video Details ---
const OneTimeVideoDetails = ({
  description,
  setDescription,
  title,
  setTitle,
  MAX_CHARS,
  showAdvanced,
  selectedLanguage = 'English',
}) => (
  <div className="space-y-8">
    {/* Confirmation Text */}
    <div className="flex items-center text-sm font-normal text-[var(--color-accent)]">
      <Check className="w-4 h-4 mr-2 text-[var(--color-accent)]" />
      <span className="tracking-tight">{getTranslation('Format selected! Now add details.', selectedLanguage)}</span>
    </div>

    {/* Examples removed per user request */}

    <div className="flex items-center justify-between text-sm text-gray-600">
      <span className="italic">{getTranslation('Using the Description and Title you entered above for this one-time video.', selectedLanguage)}</span>
      <button
        type="button"
        className="ml-4 text-sm font-medium text-[var(--color-accent)] hover:underline"
        onClick={() => {
          const el = document.getElementById("description-input");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.focus();
            el.classList.add("jump-highlight");
            setTimeout(() => el.classList.remove("jump-highlight"), 900);
          }
          const titleEl = document.getElementById("title-input");
          if (titleEl) {
            // focus title after a slight delay so the description is focused first
            setTimeout(() => {
              titleEl.focus();
              titleEl.classList.add("jump-highlight");
              setTimeout(() => titleEl.classList.remove("jump-highlight"), 900);
            }, 300);
          }
        }}
      >
        {getTranslation('Edit', selectedLanguage)}
      </button>
    </div>
  </div>
);

// --- Component for Recurrent Video Details (Multi-Step Flow) ---
const RecurrentVideoDetails = ({
  description,
  setDescription,
  title,
  setTitle,
  MAX_CHARS,
  MIN_CHARS,
  recurrentStep,
  selectedFrequency,
  setSelectedFrequency,
  selectedTones,
  setSelectedTones,
  selectedStyles,
  setSelectedStyles,
  selectedPrivacy,
  setSelectedPrivacy,
  customRecurrentDates,
  setCustomRecurrentDates,
  selectedLanguage = 'English',
  // Added missing props
  setRecurrentStep,
  selectedDeliveryType,
  selectedVideoLength,
  customVideoLength,
  uploadedFiles,
  referenceLinks,
  customPrice,
  setCustomPrice,
  editingPrice,
  setEditingPrice,
  priceInput,
  setPriceInput,
  priceInputRef,
  savePrice,
  displayPrice,
  sanitizePriceInput,
  handleSaveReview,
}) => {
  // Frequency options based on user images
  const frequencyOptions = [
    {
      type: "daily",
      title: getTranslation("Daily", selectedLanguage),
      subtitle: getTranslation("New videos delivered every day", selectedLanguage),
      Icon: Clock,
    },
    {
      type: "weekly",
      title: getTranslation("Weekly", selectedLanguage),
      subtitle: getTranslation("New videos delivered every week", selectedLanguage),
      Icon: Repeat,
    },
    {
      type: "monthly",
      title: getTranslation("Monthly", selectedLanguage),
      subtitle: getTranslation("New videos delivered every month", selectedLanguage),
      Icon: Calendar,
    },
    {
      type: "custom",
      title: getTranslation("Custom", selectedLanguage),
      subtitle: getTranslation("Set a custom delivery schedule", selectedLanguage),
      Icon: Calendar,
    },
  ];

  if (recurrentStep === 1) {
    return (
      <div className="space-y-8">
        <div className="flex items-center text-sm font-normal text-[var(--color-accent)]">
          <Check className="w-4 h-4 mr-2 text-[var(--color-accent)]" />
          <span className="tracking-tight">{getTranslation('Frequency selection unlocked!', selectedLanguage)}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="italic">{getTranslation('Using the Description and Title you entered above for this recurring request.', selectedLanguage)}</span>
          <button
            type="button"
            className="ml-4 text-sm font-medium text-[var(--color-accent)] hover:underline"
            onClick={() => {
              const el = document.getElementById("description-input");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.focus();
                el.classList.add("jump-highlight");
                setTimeout(() => el.classList.remove("jump-highlight"), 900);
              }
            }}
          >
            {getTranslation('Edit', selectedLanguage)}
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">
            {getTranslation('How often would you like creators to deliver new videos?', selectedLanguage)}
          </h2>
          <p className="text-sm text-gray-500">
            {getTranslation('Creators will plan their uploads according to your chosen rhythm.', selectedLanguage)}
          </p>
        </div>

        {/* Recurrent examples removed per user request */}

        <div className="space-y-4">
          <FrequencyDropdown
            options={frequencyOptions}
            selected={selectedFrequency}
            setSelected={setSelectedFrequency}
            selectedLanguage={selectedLanguage}
          />

          {selectedFrequency === "custom" && (
            <div className="mt-3">
              <SeriesCalendar
                selectedDates={customRecurrentDates}
                setSelectedDates={setCustomRecurrentDates}
                selectedLanguage={selectedLanguage}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (recurrentStep === 3)
    return (
      <ToneStyleStep
        selectedTones={selectedTones}
        setSelectedTones={setSelectedTones}
        selectedStyles={selectedStyles}
        setSelectedStyles={setSelectedStyles}
        selectedLanguage={selectedLanguage}
      />
    );
  if (recurrentStep === 4) return <VideoLengthStep selectedLanguage={selectedLanguage} />;
  if (recurrentStep === 5)
    return (
      <PrivacySettingsStep
        selectedPrivacy={selectedPrivacy}
        setSelectedPrivacy={setSelectedPrivacy}
        selectedLanguage={selectedLanguage}
      />
    );
  if (recurrentStep === 6)
    return (
      <ReviewRequestStep
        title={title}
        description={description}
        selectedDeliveryType={selectedDeliveryType}
        selectedFrequency={selectedFrequency}
        customRecurrentDates={customRecurrentDates}
        selectedTones={selectedTones}
        selectedVideoLength={selectedVideoLength}
        customVideoLength={customVideoLength}
        uploadedFiles={uploadedFiles}
        referenceLinks={referenceLinks}
        selectedPrivacy={selectedPrivacy}
        selectedLanguage={selectedLanguage}
        customPrice={customPrice}
        setCustomPrice={setCustomPrice}
        editingPrice={editingPrice}
        setEditingPrice={setEditingPrice}
        priceInput={priceInput}
        setPriceInput={setPriceInput}
        priceInputRef={priceInputRef}
        savePrice={savePrice}
        displayPrice={displayPrice}
        sanitizePriceInput={sanitizePriceInput}
        onEdit={() => setRecurrentStep(1)}
        onSaveReview={handleSaveReview}
      />
    );
  if (recurrentStep === 8) return <SponsorConfirmation />;
  return null;
};

// --- Reusable Component for Tone & Style Selection (Dropdown) ---
const ToneStyleStep = ({ selectedTones, setSelectedTones, selectedStyles, setSelectedStyles, selectedLanguage = 'English' }) => {
  const [open, setOpen] = useState(false);
  const [openStyle, setOpenStyle] = useState(false);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const listRefStyle = useRef(null);
  const openTimerRef = useRef(null);
  const focusTimerRef = useRef(null);
  const containerRef = useRef(null);

  const basicTones = [
    { id: "professional", label: getTranslation("Professional", selectedLanguage), Icon: Briefcase },
    { id: "casual", label: getTranslation("Casual", selectedLanguage), Icon: Coffee },
    { id: "inspirational", label: getTranslation("Inspirational / Motivational", selectedLanguage), Icon: TrendingUp },
    { id: "humorous", label: getTranslation("Humorous / Lighthearted", selectedLanguage), Icon: Smile },
    { id: "emotional", label: getTranslation("Emotional / Heartfelt", selectedLanguage), Icon: Heart },
    { id: "analytical", label: getTranslation("Analytical / Educational", selectedLanguage), Icon: BookOpen },
  ];

  const advancedTones = [
    { id: "dramatic", label: getTranslation("Dramatic / Cinematic", selectedLanguage), Icon: Film },
    { id: "sarcastic", label: getTranslation("Sarcastic / Satirical", selectedLanguage), Icon: MessageCircle },
    { id: "romantic", label: getTranslation("Romantic / Soothing", selectedLanguage), Icon: User },
    { id: "bold", label: getTranslation("Bold / Controversial", selectedLanguage), Icon: Shield },
    { id: "serious", label: getTranslation("Serious / Neutral", selectedLanguage), Icon: Target },
    { id: "experimental", label: getTranslation("Experimental / Artistic", selectedLanguage), Icon: Palette },
    { id: "hopeful", label: getTranslation("Hopeful / Reflective", selectedLanguage), Icon: Sparkles },
  ];

  const toggleTone = (id) => {
    if (selectedTones.includes(id)) {
      setSelectedTones(selectedTones.filter((t) => t !== id));
    } else {
      if (selectedTones.length < 2) {
        setSelectedTones([...selectedTones, id]);
        // Close the dropdown after a selection to reduce friction
        setOpen(false);
      }
    }
  };

  // Styles (separate picker)
  const basicStyles = [
    { id: "cinematic", label: getTranslation("Cinematic", selectedLanguage), Icon: Film },
    { id: "minimal", label: getTranslation("Minimal", selectedLanguage), Icon: Palette },
    { id: "documentary", label: getTranslation("Documentary", selectedLanguage), Icon: BookOpen },
    { id: "animated", label: getTranslation("Animated", selectedLanguage), Icon: Sparkles },
    { id: "vibrant", label: getTranslation("Vibrant", selectedLanguage), Icon: TrendingUp },
    { id: "intimate", label: getTranslation("Intimate", selectedLanguage), Icon: Heart },
  ];

  const toggleStyle = (id) => {
    if (selectedStyles.includes(id)) {
      setSelectedStyles(selectedStyles.filter((s) => s !== id));
    } else {
      // Limit styles to a single choice for clarity
      setSelectedStyles([id]);
      setOpenStyle(false);
    }
  };

  // Tone dropdown no longer auto-opens; users open it deliberately.

  useEffect(() => {
    // Close dropdown when user taps/clicks outside, or presses Escape.
    const handleOutside = (e) => {
      try {
        if (!open) return;
        const el = containerRef.current;
        if (!el) return;
        if (!el.contains(e.target)) {
          setOpen(false);
        }
      } catch (err) { }
    };

    const handleKey = (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside, { passive: true });
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const renderToneLabel = () => {
    if (selectedTones.length === 0) return <div className="text-sm text-gray-500">{getTranslation('Choose tone', selectedLanguage)}</div>;
    return (
      <div className="flex items-center space-x-2">
        {selectedTones.map((id) => {
          const opt = [...basicTones, ...advancedTones].find((o) => o.id === id);
          if (!opt) return null;
          return (
            <span key={id} className="inline-flex items-center space-x-2">
              <opt.Icon className="w-4 h-4 text-[var(--color-gold)]" />
              <span className="text-sm text-gray-800 font-medium">{opt.label.split(' ')[0]}</span>
            </span>
          );
        })}
      </div>
    );
  };

  const renderStyleLabel = () => {
    if (!selectedStyles || selectedStyles.length === 0) return <div className="text-sm text-gray-500">{getTranslation('Choose style', selectedLanguage)}</div>;
    const id = selectedStyles[0];
    const opt = basicStyles.find((o) => o.id === id);
    if (!opt) return <div className="text-sm text-gray-500">{getTranslation('Choose style', selectedLanguage)}</div>;
    return (
      <div className="flex items-center space-x-2">
        <span className="inline-flex items-center space-x-2">
          <opt.Icon className="w-4 h-4 text-[var(--color-gold)]" />
          <span className="text-sm text-gray-800 font-medium">{opt.label.split(' ')[0]}</span>
        </span>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="space-y-2 text-left flex items-center">
        <Crown className="w-5 h-5 mr-3 text-[var(--color-gold)] flex-shrink-0" style={{ transform: 'translateY(4px)' }} />
        <h3 className="text-gray-800 font-semibold text-base block tracking-tight">
          {getTranslation('Choose Your Tone & Style', selectedLanguage)}
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        {/* Tone picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((s) => !s)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="w-full flex items-center justify-between p-4 bg-[var(--surface)] border border-gray-200 rounded-xl shadow-sm"
          >
            <div className="flex items-center">
              {renderToneLabel()}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {open && (
            <div className="absolute z-30 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg">
              <ul ref={listRef} role="listbox" aria-label="Tone" className="divide-y divide-gray-100 max-h-72 overflow-auto">
                {[...basicTones, ...advancedTones].map((tone) => {
                  const disabled = !selectedTones.includes(tone.id) && selectedTones.length >= 2;
                  return (
                    <li
                      key={tone.id}
                      role="option"
                      aria-selected={selectedTones.includes(tone.id)}
                      tabIndex={disabled ? -1 : 0}
                      onClick={() => !disabled && toggleTone(tone.id)}
                      onKeyDown={(e) => {
                        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          toggleTone(tone.id);
                        }
                      }}
                      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <tone.Icon className={`w-5 h-5 mr-3 ${selectedTones.includes(tone.id) ? 'text-[var(--color-gold)]' : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{tone.label}</div>
                      </div>
                      {selectedTones.includes(tone.id) && <Check className="w-4 h-4 text-[var(--color-gold)]" />}
                    </li>
                  );
                })}
              </ul>
              <div className="p-3 text-xs text-gray-500 border-t border-gray-100">{getTranslation('Tip: choose up to two tones. Selected tones help creators match style.', selectedLanguage)}</div>
            </div>
          )}
        </div>

        {/* Style picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenStyle((s) => !s)}
            aria-haspopup="listbox"
            aria-expanded={openStyle}
            className="w-full flex items-center justify-between p-4 bg-[var(--surface)] border border-gray-200 rounded-xl shadow-sm"
          >
            <div className="flex items-center">
              {renderStyleLabel()}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {openStyle && (
            <div className="absolute z-30 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg">
              <ul ref={listRefStyle} role="listbox" aria-label="Style" className="divide-y divide-gray-100 max-h-72 overflow-auto">
                {basicStyles.map((style) => {
                  const selected = selectedStyles.includes(style.id);
                  return (
                    <li
                      key={style.id}
                      role="option"
                      aria-selected={selected}
                      tabIndex={0}
                      onClick={() => toggleStyle(style.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleStyle(style.id);
                        }
                      }}
                      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${selected ? '' : ''}`}
                    >
                      <style.Icon className={`w-5 h-5 mr-3 ${selected ? 'text-[var(--color-gold)]' : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{style.label}</div>
                      </div>
                      {selected && <Check className="w-4 h-4 text-[var(--color-gold)]" />}
                    </li>
                  );
                })}
              </ul>
              <div className="p-3 text-xs text-gray-500 border-t border-gray-100">{getTranslation('Tip: choose a style to help communicate visual approach.', selectedLanguage)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Reusable Component for Video Length Selection (New Step) ---
const VideoLengthStep = ({
  selectedLength,
  setSelectedLength,
  customLength,
  setCustomLength,
  selectedLanguage = 'English',
}) => {
  const lengths = [
    {
      id: "short-form",
      label: getTranslation("Short Form", selectedLanguage),
      duration: getTranslation("15 sec – 1 min", selectedLanguage),
      description:
        getTranslation("Quick insights, reactions, jokes, highlights – TikTok/Reel style", selectedLanguage),
    },
    {
      id: "standard",
      label: getTranslation("Standard", selectedLanguage),
      duration: getTranslation("2–5 min", selectedLanguage),
      description:
        getTranslation("Mini explanations, challenges, creative short stories, tutorials", selectedLanguage),
    },
    {
      id: "extended",
      label: getTranslation("Extended", selectedLanguage),
      duration: getTranslation("6–15 min", selectedLanguage),
      description: getTranslation("Deeper dives, analyses, vlogs, storytime, discussions", selectedLanguage),
    },
    {
      id: "long-form",
      label: getTranslation("Long Form", selectedLanguage),
      duration: getTranslation("16–30+ min", selectedLanguage),
      description: getTranslation("Documentaries, interviews, or in-depth guides", selectedLanguage),
    },
    {
      id: "custom",
      label: getTranslation("Custom", selectedLanguage),
      duration: getTranslation("User defined", selectedLanguage),
      description: getTranslation("Let creators decide what fits best", selectedLanguage),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header: use the question as the primary left-aligned heading (matches Tone & Style) */}
      <div className="space-y-2 text-left flex items-center">
        <Crown className="w-5 h-5 mr-3 text-[var(--color-gold)] flex-shrink-0" style={{ transform: 'translateY(4px)' }} />
        <h3 className="text-gray-800 font-semibold text-base block tracking-tight">
          {getTranslation('How long should your video be?', selectedLanguage)}
        </h3>
      </div>

      {/* Examples Box */}
      {!localStorage.getItem('ideas_examples_seen_v1') && (
        <div className="rounded-xl cream-glow-box p-5" style={{ background: "radial-gradient(circle at 16% 16%, rgba(var(--color-gold-rgb,203,138,0),0.08), rgba(var(--color-gold-rgb,203,138,0),0.02) 26%, var(--color-cream-bg) 60%), var(--color-cream-bg)", border: "1px solid rgba(var(--color-gold-rgb,203,138,0),0.10)", boxShadow: "inset 0 4px 12px rgba(var(--color-gold-rgb,203,138,0),0.02)" }}>
          <div className="flex items-center mb-3">
            <Lightbulb className="w-5 h-5 text-[var(--color-gold)] mr-2" />
            <h3 className="text-sm font-normal text-gray-700">
              {getTranslation('Examples for video length:', selectedLanguage)}
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-gray-600 list-none pl-0">
            <li>
              <strong className="text-gray-800">{getTranslation('Short Form (15s–1m):', selectedLanguage)}</strong>{" "}
              {getTranslation('Quick tips, reactions, TikTok/Reels-style content', selectedLanguage)}
            </li>
            <li>
              <strong className="text-gray-800">{getTranslation('Standard (2–5m):', selectedLanguage)}</strong>{" "}
              {getTranslation('Tutorials, challenges, product demos, reviews', selectedLanguage)}
            </li>
            <li>
              <strong className="text-gray-800">{getTranslation('Extended (6–15m):', selectedLanguage)}</strong> {getTranslation('Deep dives, vlogs, detailed explanations, discussions', selectedLanguage)}
            </li>
            <li>
              <strong className="text-gray-800">{getTranslation('Long Form (16–30m+):', selectedLanguage)}</strong>{" "}
              {getTranslation('Documentaries, interviews, masterclasses, podcasts', selectedLanguage)}
            </li>
            <li>
              <strong className="text-gray-800">{getTranslation('Custom:', selectedLanguage)}</strong> {getTranslation('Let creators choose based on your content', selectedLanguage)}
            </li>
          </ul>
        </div>
      )}

      {/* Lengths Dropdown (compact) */}
      <VideoLengthDropdown
        lengths={lengths}
        selectedLength={selectedLength}
        setSelectedLength={setSelectedLength}
        customLength={customLength}
        setCustomLength={setCustomLength}
        selectedLanguage={selectedLanguage}
      />
    </div>
  );
};

// --- Compact Dropdown for Video Lengths (extract for clarity) ---
const VideoLengthDropdown = ({ lengths, selectedLength, setSelectedLength, customLength, setCustomLength, selectedLanguage = 'English' }) => {
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (listRef.current && listRef.current.contains(e.target)) return;
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  const handleSelect = (id) => {
    setSelectedLength(id);
    setOpen(false);
  };

  const selectedObj = lengths.find((l) => l.id === selectedLength);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between p-4 bg-[var(--surface)] border border-gray-200 rounded-xl shadow-sm"
      >
        <div className="text-left">
          {selectedObj ? (
            <div className="text-sm font-medium text-gray-800">{getTranslation(selectedObj.label, selectedLanguage)}</div>
          ) : (
            <div className="text-sm text-gray-500">{getTranslation('Select preferred video length', selectedLanguage)}</div>
          )}
          <div className="text-xs text-gray-400">{selectedObj ? getTranslation(selectedObj.duration, selectedLanguage) : ""}</div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg">
          <ul ref={listRef} role="listbox" aria-label="Video lengths" className="divide-y divide-gray-100">
            {lengths.map((len) => (
              <li
                key={len.id}
                role="option"
                tabIndex={0}
                aria-selected={selectedLength === len.id}
                onClick={() => handleSelect(len.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(len.id);
                  }
                }}
                className={`p-3 flex items-start cursor-pointer hover:bg-gray-50 ${selectedLength === len.id ? "bg-[var(--color-gold-cream)]" : ""}`}
              >
                <div className="flex-1">
                  <div className={`text-sm font-medium ${selectedLength === len.id ? "text-gray-900" : "text-gray-800"}`}>{getTranslation(len.label, selectedLanguage)}</div>
                  <div className="text-xs text-gray-500">{getTranslation(len.duration, selectedLanguage)}</div>
                  <div className="text-xs text-gray-600 mt-1">{getTranslation(len.description, selectedLanguage)}</div>
                  {len.id === "custom" && selectedLength === "custom" && (
                    <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        placeholder={getTranslation("Enter desired length (e.g. 45 mins)", selectedLanguage)}
                        value={customLength}
                        onChange={(e) => setCustomLength(e.target.value)}
                        className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)] transition-all"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (customLength.trim()) {
                            // Button click confirmed the input, parent will handle closing
                          }
                        }}
                        className="px-3 py-3 bg-[var(--color-gold)] hover:bg-[var(--color-gold)]/90 text-white rounded-lg flex items-center justify-center transition-colors"
                        title={getTranslation("Save", selectedLanguage)}
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                {selectedLength === len.id && (
                  <Check className="w-4 h-4 text-[var(--color-gold)] ml-3" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- Compact Dropdown for Frequency Selection ---
const FrequencyDropdown = ({ options, selected, setSelected, selectedLanguage = 'English' }) => {
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (listRef.current && listRef.current.contains(e.target)) return;
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  const handleSelect = (id) => {
    setSelected(id);
    setOpen(false);
  };

  const selectedObj = options.find((o) => o.type === selected);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between p-4 bg-[var(--surface)] border border-gray-200 rounded-xl shadow-sm"
      >
        <div className="text-left">
          {selectedObj ? (
            <div className="text-sm font-medium text-gray-800">{getTranslation(selectedObj.title, selectedLanguage)}</div>
          ) : (
            <div className="text-sm text-gray-500">{getTranslation('Select frequency', selectedLanguage)}</div>
          )}
          <div className="text-xs text-gray-400">{selectedObj ? getTranslation(selectedObj.subtitle, selectedLanguage) : ""}</div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg">
          <ul ref={listRef} role="listbox" aria-label="Frequency options" className="divide-y divide-gray-100">
            {options.map((opt) => (
              <li
                key={opt.type}
                role="option"
                tabIndex={0}
                aria-selected={selected === opt.type}
                onClick={() => handleSelect(opt.type)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(opt.type);
                  }
                }}
                className={`p-3 flex items-start cursor-pointer hover:bg-gray-50 ${selected === opt.type ? "bg-[var(--color-gold-cream)]" : ""}`}
              >
                <div className="flex-1">
                  <div className={`text-sm font-medium ${selected === opt.type ? "text-gray-900" : "text-gray-800"}`}>{getTranslation(opt.title, selectedLanguage)}</div>
                  <div className="text-xs text-gray-500">{getTranslation(opt.subtitle, selectedLanguage)}</div>
                </div>
                {selected === opt.type && <Check className="w-4 h-4 text-[var(--color-gold)] ml-3" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- Reusable Component for References (New Step) ---
const ReferencesStep = ({ files, setFiles, links, setLinks, selectedLanguage = 'English' }) => {
  const fileInputRef = useRef(null);
  const [linkInput, setLinkInput] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const handleAddLink = () => {
    if (linkInput.trim()) {
      setLinks([...links, linkInput.trim()]);
      setLinkInput("");
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-[var(--bg)] transition-colors cursor-pointer bg-[var(--surface)]"
      >
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <div className="p-3 bg-gray-100 rounded-full mb-3">
          <FileText className="w-6 h-6 text-gray-500" />
        </div>
        <h3 className="text-sm font-normal text-gray-700">
          {getTranslation('Upload reference files', selectedLanguage)}
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          {getTranslation('Images, videos, PDFs, documents', selectedLanguage)}
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center overflow-hidden">
                <FileText className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Link Input */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder={getTranslation('Add reference links', selectedLanguage) + '...'}
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
          className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)] transition-all"
        />
        <button
          onClick={handleAddLink}
          className="p-4 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <LinkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Link List */}
      {links.length > 0 && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          {links.map((link, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center overflow-hidden">
                <LinkIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <span className="text-sm text-blue-600 truncate underline">
                  {link}
                </span>
              </div>
              <button
                onClick={() => removeLink(index)}
                className="text-gray-400 hover:text-red-500 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Reusable Component for Calendar (New) ---
const SeriesCalendar = ({ selectedDates, setSelectedDates, selectedLanguage = 'English' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (day) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toDateString();
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const monthNames = [
    getTranslation("January", selectedLanguage),
    getTranslation("February", selectedLanguage),
    getTranslation("March", selectedLanguage),
    getTranslation("April", selectedLanguage),
    getTranslation("May", selectedLanguage),
    getTranslation("June", selectedLanguage),
    getTranslation("July", selectedLanguage),
    getTranslation("August", selectedLanguage),
    getTranslation("September", selectedLanguage),
    getTranslation("October", selectedLanguage),
    getTranslation("November", selectedLanguage),
    getTranslation("December", selectedLanguage),
  ];

  return (
    <div className="mt-4 p-4 bg-[var(--surface)] rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() =>
            setCurrentDate(
              new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
            )
          }
          className="p-1 hover:bg-[var(--bg)] rounded-full"
        >
          <MoveLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="font-semibold text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button
          onClick={() =>
            setCurrentDate(
              new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
            )
          }
          className="p-1 hover:bg-[var(--bg)] rounded-full"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-xs font-medium text-gray-400">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((b) => (
          <div key={`blank-${b}`} />
        ))}
        {days.map((day) => {
          const dateStr = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
          ).toDateString();
          const isSelected = selectedDates.includes(dateStr);
          return (
            <div
              key={day}
              onClick={(e) => {
                e.stopPropagation();
                handleDateClick(day);
              }}
              className={`
                                h-8 w-8 flex items-center justify-center rounded-full text-sm cursor-pointer transition-colors
                                ${isSelected
                  ? "bg-[var(--color-gold)] text-white"
                  : "hover:bg-[var(--bg)] text-gray-700"
                }
                            `}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-gray-500 text-center">
        {selectedDates.length} dates selected
      </div>
    </div>
  );
};

// --- Component for Series Video Details ---
const SeriesVideoDetails = ({
  description,
  setDescription,
  title,
  setTitle,
  MAX_CHARS,
  seriesStep,
  numberOfEpisodes,
  setNumberOfEpisodes,
  selectedReleaseSchedule,
  setSelectedReleaseSchedule,
  customSeriesDates,
  setCustomSeriesDates,
  selectedLanguage = 'English',
}) => {
  const scheduleOptions = [
    { id: "all-at-once", label: getTranslation("All at once", selectedLanguage), icon: Film },
    { id: "weekly", label: getTranslation("Weekly", selectedLanguage), icon: Clock },
    { id: "monthly", label: getTranslation("Monthly", selectedLanguage), icon: Calendar },
    { id: "custom", label: getTranslation("Custom Dates", selectedLanguage), icon: Pencil },
  ];

  // Local state for a compact, editable episodes dropdown
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const episodesRef = useRef(null);
  const episodesBtnRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!episodesOpen) return;
      if (episodesRef.current && episodesRef.current.contains(e.target)) return;
      if (episodesBtnRef.current && episodesBtnRef.current.contains(e.target)) return;
      setEpisodesOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [episodesOpen]);

  if (seriesStep === 1) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="italic">{getTranslation('Using the Description and Title you entered above for this series.', selectedLanguage)}</span>
          <button
            type="button"
            className="ml-4 text-sm font-medium text-[var(--color-accent)] hover:underline"
            onClick={() => {
              const el = document.getElementById("description-input");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.focus();
                el.classList.add("jump-highlight");
                setTimeout(() => el.classList.remove("jump-highlight"), 900);
              }
            }}
          >
            {getTranslation('Edit', selectedLanguage)}
          </button>
        </div>
      </div>
    );
  }

  if (seriesStep === 2) {
    return (
      <div className="space-y-8">
        <div className="flex items-center text-sm font-normal text-[var(--color-accent)]">
          <Check className="w-4 h-4 mr-2 text-[var(--color-accent)]" />
          <span className="tracking-tight">{getTranslation('Format selected! Now detail your series.', selectedLanguage)}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="italic">{getTranslation('Using the Description and Title you entered above for this series.', selectedLanguage)}</span>
          <button
            type="button"
            className="ml-4 text-sm font-medium text-[var(--color-accent)] hover:underline"
            onClick={() => {
              const el = document.getElementById("description-input");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.focus();
                el.classList.add("jump-highlight");
                setTimeout(() => el.classList.remove("jump-highlight"), 900);
              }
              const titleEl = document.getElementById("title-input");
              if (titleEl) {
                setTimeout(() => {
                  titleEl.focus();
                  titleEl.classList.add("jump-highlight");
                  setTimeout(() => titleEl.classList.remove("jump-highlight"), 900);
                }, 300);
              }
            }}
          >
            {getTranslation('Edit', selectedLanguage)}
          </button>
        </div>

        <div>
          <label className="text-gray-800 font-semibold text-base block mb-3">
            {getTranslation('How many episodes would you like?', selectedLanguage)}
          </label>

          <div className="relative" style={{ maxWidth: 220 }}>
            <button
              ref={episodesBtnRef}
              type="button"
              onClick={() => setEpisodesOpen((s) => !s)}
              className="w-full flex items-center justify-between px-3 py-2 bg-[var(--surface)] border border-gray-200 rounded-xl shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <ChevronDown className="w-4 h-4 text-gray-500" />
                <div className="text-lg font-semibold">{numberOfEpisodes}</div>
                <span className="text-xs text-gray-400">{getTranslation('episodes', selectedLanguage)}</span>
              </div>
              <ChevronUp className="w-4 h-4 text-gray-500" />
            </button>

            {episodesOpen && (
              <div
                ref={episodesRef}
                className="absolute z-30 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg p-3"
              >
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setNumberOfEpisodes(Math.max(1, numberOfEpisodes - 1))}
                    className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100"
                    aria-label="Decrease episodes"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={numberOfEpisodes}
                    onChange={(e) => {
                      const v = Math.max(1, parseInt(e.target.value || "0", 10) || 1);
                      setNumberOfEpisodes(v);
                    }}
                    className="mx-3 text-center font-bold w-16 p-2 border rounded-lg"
                    aria-label="Number of episodes"
                  />
                  <button
                    onClick={() => setNumberOfEpisodes(numberOfEpisodes + 1)}
                    className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100"
                    aria-label="Increase episodes"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 10, 25, 50, 100].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setNumberOfEpisodes(n);
                        setEpisodesOpen(false);
                      }}
                      className="py-2 px-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-gray-800 font-semibold text-base block mb-3">
            {getTranslation('How often would you like personalized videos delivered?', selectedLanguage)}
          </label>
          <p className="text-xs text-gray-500 mb-2">Pick a rhythm creators should follow (daily, weekly, monthly, or custom).</p>
          <div className="w-full">
            <FrequencyDropdown
              options={scheduleOptions.map((o) => ({ type: o.id, title: o.label, subtitle: o.label }))}
              selected={selectedReleaseSchedule}
              setSelected={setSelectedReleaseSchedule}
              selectedLanguage={selectedLanguage}
            />
          </div>
          {selectedReleaseSchedule === "custom" && (
            <SeriesCalendar
              selectedDates={customSeriesDates}
              setSelectedDates={setCustomSeriesDates}
            />
          )}
        </div>
      </div>
    );
  }
  return null;
};

// --- Compact editable dropdown for Catalogue target videos (mirrors episodes control)
const CatalogueTargetDropdown = ({ value, setValue, selectedLanguage = 'English' }) => {
  const [open, setOpen] = useState(false);
  const targetRef = useRef(null);
  const targetBtnRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (targetRef.current && targetRef.current.contains(e.target)) return;
      if (targetBtnRef.current && targetBtnRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  return (
    <div className="relative" style={{ maxWidth: 220 }}>
      <button
        ref={targetBtnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[var(--surface)] border border-gray-200 rounded-xl shadow-sm"
      >
        <div className="flex items-center space-x-3">
          <ChevronDown className="w-4 h-4 text-gray-500" />
          <div className="text-lg font-semibold">{value}</div>
          <span className="text-xs text-gray-400">{getTranslation('videos', selectedLanguage)}</span>
        </div>
        <ChevronUp className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <div ref={targetRef} className="absolute z-30 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setValue(Math.max(1, (value || 0) - 1))}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100"
              aria-label="Decrease videos"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={value}
              onChange={(e) => {
                const v = Math.max(1, parseInt(e.target.value || "0", 10) || 1);
                setValue(v);
              }}
              className="mx-3 text-center font-bold w-16 p-2 border rounded-lg"
              aria-label="Number of videos"
            />
            <button
              onClick={() => setValue((value || 0) + 1)}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100"
              aria-label="Increase videos"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[3, 5, 10, 25, 50, 100].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setValue(n);
                  setOpen(false);
                }}
                className="py-2 px-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Component for Catalogue Video Details ---
const CatalogueVideoDetails = ({
  description,
  setDescription,
  title,
  setTitle,
  MAX_CHARS,
  catalogueStep,
  targetVideos,
  setTargetVideos,
  themes,
  setThemes,
  selectedLanguage = 'English',
}) => {
  if (catalogueStep === 1) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="italic">{getTranslation('Using the Description and Title you entered above for this catalogue.', selectedLanguage)}</span>
          <button
            type="button"
            className="ml-4 text-sm font-medium text-[var(--color-accent)] hover:underline"
            onClick={() => {
              const el = document.getElementById("description-input");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.focus();
                el.classList.add("jump-highlight");
                setTimeout(() => el.classList.remove("jump-highlight"), 900);
              }
            }}
          >
            {getTranslation('Edit', selectedLanguage)}
          </button>
        </div>
      </div>
    );
  }

  if (catalogueStep === 2) {
    return (
      <div className="space-y-8">
        <div className="flex items-center text-sm font-normal text-[var(--color-accent)]">
          <Check className="w-4 h-4 mr-2 text-[var(--color-accent)]" />
          <span className="tracking-tight">{getTranslation('Catalogue selected — set target videos and themes.', selectedLanguage)}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="italic">{getTranslation('Using the Description and Title you entered above for this catalogue.', selectedLanguage)}</span>
          <button
            type="button"
            className="ml-4 text-sm font-medium text-[var(--color-accent)] hover:underline"
            onClick={() => {
              const el = document.getElementById("description-input");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.focus();
                el.classList.add("jump-highlight");
                setTimeout(() => el.classList.remove("jump-highlight"), 900);
              }
            }}
          >
            {getTranslation('Edit', selectedLanguage)}
          </button>
        </div>

        <div>
          <label className="text-gray-800 font-semibold text-base block mb-3">
            {getTranslation('How many videos would you like?', selectedLanguage)}
          </label>

          {/* Compact editable dropdown like episodes */}
          <CatalogueTargetDropdown
            value={targetVideos}
            setValue={setTargetVideos}
            selectedLanguage={selectedLanguage}
          />
        </div>

        <div>
          <label className="text-gray-800 font-semibold text-base block mb-3">
            {getTranslation('Which themes or categories should we cover?', selectedLanguage)}
          </label>
          <textarea
            rows="4"
            placeholder={getTranslation("List the themes or categories to cover (e.g., 'Breakfast, Lunch, Dinner, Snacks')", selectedLanguage)}
            value={themes}
            onChange={(e) => setThemes(e.target.value)}
            className="w-full p-4 text-gray-700 border border-gray-200 rounded-xl focus:ring-0 focus:border-gray-300 outline-none text-base"
          ></textarea>
        </div>
      </div>
    );
  }
  return null;
};

// --- Component for Privacy Settings ---
const PrivacySettingsStep = ({ selectedPrivacy, setSelectedPrivacy, prevStepCompleted = false, selectedLanguage = 'English' }) => {
  const options = [
    {
      id: "public",
      label: getTranslation("Public", selectedLanguage),
      icon: Globe,
      desc: getTranslation("Visible to everyone", selectedLanguage),
      price: null,
      cost: 0,
    },
    {
      id: "unlisted",
      label: getTranslation("Unlisted", selectedLanguage),
      icon: LinkIcon,
      desc: getTranslation("Only people with the link", selectedLanguage),
      price: "+$5.99",
      cost: 5.99,
    },
    {
      id: "private",
      label: getTranslation("Private", selectedLanguage),
      icon: Lock,
      desc: getTranslation("Only you", selectedLanguage),
      price: "+$7.99",
      cost: 7.99,
    },
  ];

  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  // Run the outline animation whenever no privacy option is selected
  const runAnim = !selectedPrivacy;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-left">
        <div className="relative" ref={containerRef}>
          <style>{`
                .privacy-outline-svg { position: absolute; inset: 0; pointer-events: none; overflow: visible; }
                .privacy-outline-base { stroke: rgba(226,232,240,1); stroke-width: 1.5; fill: none; stroke-linejoin: round; }

                /* Perimeter for rect(97x37) = 2*(97+37) = 268
                   The short "moving snake" length is increased to 597 (3×199)
                   so the animated gradient band appears longer while still
                   remaining shorter than the full perimeter. */
                /* Tail (gradient) - use the longer moving band length (597) */
                .privacy-outline-accent {
                  stroke: url(#privacyGrad);
                  stroke-width: 3.0;
                  fill: none;
                  stroke-linejoin: round;
                  stroke-linecap: round;
                  /* moving band length (199) — keep <= perimeter so animation is visible */
                  stroke-dasharray: 199;
                  stroke-dashoffset: 0;
                  opacity: 1;
                  transform-origin: center;
                }
                .privacy-outline-accent.run {
                  opacity: 1;
                  animation: privacy-run 2400ms cubic-bezier(.2,.9,.2,1) infinite;
                }

                /* moving rect styling (explicit) - prevents small square artifacts at corners */
                .privacy-outline-mover {
                  stroke: url(#privacyGrad);
                  stroke-width: 3.0;
                  fill: none;
                  stroke-linejoin: round;
                  stroke-linecap: round;
                  /* match moving band length so animation is visible */
                  stroke-dasharray: 199;
                  stroke-dashoffset: 0;
                  opacity: 1;
                }
                .privacy-outline-mover.run {
                  animation: privacy-run 2400ms cubic-bezier(.2,.9,.2,1) infinite;
                }

                /* Head (solid comet) sits on top of the moving tail and gives a moving point */
                .privacy-outline-head {
                  stroke: var(--color-accent);
                  stroke-width: 4.0;
                  fill: none;
                  stroke-linecap: round;
                  /* head length (24) + gap so total equals the moving band (199) */
                  stroke-dasharray: 24 175; /* 24 + 175 = 199 */
                  stroke-dashoffset: 0;
                  opacity: 1.0;
                }
                .privacy-outline-head.run {
                  opacity: 1;
                  animation: privacy-run 2400ms cubic-bezier(.2,.9,.2,1) infinite;
                }

                /* move dashoffset negative to travel clockwise around the rect
                   use the new moving band length (597) for a full loop offset */
                @keyframes privacy-run {
                  from { stroke-dashoffset: 0; }
                  to { stroke-dashoffset: -199; }
                }
              `}</style>

          <button
            type="button"
            onClick={() => setOpen((s) => !s)}
            className="w-full flex items-center justify-between p-4 bg-[var(--surface)] border border-gray-200 rounded-xl shadow-sm relative overflow-visible"
            aria-haspopup="listbox"
            aria-expanded={open}
            style={{ zIndex: 1 }}
          >
            <div className="text-left">
              <div className="text-gray-800 font-semibold text-base block tracking-tight">{getTranslation('Who should be able to see your video?', selectedLanguage)}</div>
              <div className="text-sm text-gray-500">{getTranslation(((options.find((o) => o.id === selectedPrivacy) || {}).label || 'Select visibility'), selectedLanguage)}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {/* SVG overlay for animated outline (gradient tail + head) */}
          <svg className="privacy-outline-svg" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="privacyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" stopOpacity="0" />
                <stop offset="8%" stopColor="var(--color-accent)" stopOpacity="0.18" />
                <stop offset="30%" stopColor="var(--color-accent)" stopOpacity="0.95" />
                <stop offset="80%" stopColor="var(--color-accent)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </linearGradient>
              {/* clip path inset slightly so animated strokes don't draw sharp corner pixels */}
              <clipPath id="privacyClip">
                <rect x="2.5" y="2.5" width="95" height="35" rx="11" />
              </clipPath>
            </defs>

            <rect x="1.5" y="1.5" width="97" height="37" rx="12" className="privacy-outline-base" />
            {/* Animated accent/mover/head removed to avoid corner artifacts */}
          </svg>

          {open && (
            <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg">
              <ul role="listbox" className="divide-y divide-gray-100">
                {options.map((opt) => (
                  <li
                    key={opt.id}
                    role="option"
                    tabIndex={0}
                    aria-selected={selectedPrivacy === opt.id}
                    onClick={() => {
                      setSelectedPrivacy(opt.id);
                      setOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedPrivacy(opt.id);
                        setOpen(false);
                      }
                    }}
                    className="p-3 flex items-start cursor-pointer hover:bg-gray-50"
                  >
                    <opt.icon className={`w-5 h-5 mr-3 mt-0.5 ${selectedPrivacy === opt.id ? "text-[var(--color-gold)]" : "text-gray-400"}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div className={`text-sm font-medium ${selectedPrivacy === opt.id ? "text-gray-900" : "text-gray-700"}`}>
                          {getTranslation(opt.label, selectedLanguage)}
                        </div>
                        {opt.price && <div className="text-sm font-normal text-gray-900">{opt.price}</div>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{getTranslation(opt.desc, selectedLanguage)}</div>
                    </div>
                    {selectedPrivacy === opt.id && (
                      <div className="ml-3 mt-0.5">
                        <Check className="w-4 h-4 text-[var(--color-gold)]" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Component for Review Request ---
const ReviewRequestStep = ({
  title,
  description,
  selectedDeliveryType,
  selectedTones,
  selectedVideoLength,
  customVideoLength,
  selectedPrivacy,
  // Specific props (may be undefined depending on flow)
  selectedFrequency,
  customRecurrentDates,
  numberOfEpisodes,
  selectedReleaseSchedule,
  customSeriesDates,
  targetVideos,
  themes,
  uploadedFiles,
  referenceLinks,
  customPrice,
  setCustomPrice,
  editingPrice,
  setEditingPrice,
  priceInput,
  setPriceInput,
  priceInputRef,
  savePrice,
  displayPrice,
  sanitizePriceInput,
  onEdit,
  onSaveReview,
  selectedLanguage = 'English',
}) => {
  // Helper: format simple selection keys into readable labels
  const formatLabel = (key) => {
    const map = {
      daily: getTranslation("Daily", selectedLanguage),
      weekly: getTranslation("Weekly", selectedLanguage),
      biweekly: getTranslation("Biweekly", selectedLanguage),
      monthly: getTranslation("Monthly", selectedLanguage),
      custom: getTranslation("Custom", selectedLanguage),
      immediate: getTranslation("Immediate", selectedLanguage),
      "one-off": getTranslation("One-off", selectedLanguage),
    };
    return map[key] || key;
  };

  // Helper: map video length keys to human friendly labels
  const getLengthLabel = () => {
    const map = {
      "short-form": getTranslation("Short Form", selectedLanguage),
      standard: getTranslation("Standard", selectedLanguage),
      extended: getTranslation("Extended", selectedLanguage),
      "long-form": getTranslation("Long Form", selectedLanguage),
    };
    return map[selectedVideoLength] || selectedVideoLength;
  };

  const getPrivacyLabel = () => {
    const map = {
      public: getTranslation("Public", selectedLanguage),
      unlisted: getTranslation("Unlisted", selectedLanguage) + " (+$5.99)",
      private: getTranslation("Private", selectedLanguage) + " (+$9.99)",
    };
    return map[selectedPrivacy] || selectedPrivacy;
  };

  // Preview expand/collapse state to match RequestCard behavior
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const PREVIEW_MAX_LENGTH = 120;
  const needsPreviewTruncation =
    description && description.length > PREVIEW_MAX_LENGTH;
  const displayedPreviewDescription =
    previewExpanded || !needsPreviewTruncation
      ? description
      : description
        ? description.substring(0, PREVIEW_MAX_LENGTH) + "..."
        : "";
  const togglePreviewExpanded = () => setPreviewExpanded((prev) => !prev);

  // Inline-edit state for the review card
  const [editingField, setEditingField] = useState(null); // 'title'|'description'|'privacy'|'budget'|null
  const [localValues, setLocalValues] = useState({
    title: title || "",
    description: description || "",
    delivery: selectedDeliveryType || "",
    frequency: selectedFrequency || null,
    length: selectedVideoLength || null,
    customLength: customVideoLength || "",
    privacy: selectedPrivacy || null,
    price: typeof customPrice === 'number' ? customPrice : displayPrice || 0,
    tones: selectedTones || [],
    themes: themes || "",
  });

  useEffect(() => {
    setLocalValues({
      title: title || "",
      description: description || "",
      delivery: selectedDeliveryType || "",
      frequency: selectedFrequency || null,
      length: selectedVideoLength || null,
      customLength: customVideoLength || "",
      privacy: selectedPrivacy || null,
      price: typeof customPrice === 'number' ? customPrice : displayPrice || 0,
      tones: selectedTones || [],
      themes: themes || "",
    });
  }, [title, description, selectedDeliveryType, selectedFrequency, selectedVideoLength, customVideoLength, selectedPrivacy, customPrice, selectedTones, themes]);

  // (review border animation removed)

  const saveLocalField = (field) => {
    // propagate known setters when available
    if (field === 'price' && typeof setCustomPrice === 'function') {
      setCustomPrice(Number(localValues.price) || 0);
    }
    // If parent supplied a save handler, call it
    if (typeof onSaveReview === 'function') {
      try { onSaveReview(localValues); } catch (e) { }
    }
    setEditingField(null);
  };

  return (
    <div className="relative ideas-review-root animate-in fade-in slide-in-from-bottom-4 duration-500">
      <style>{`
        .review-card { border-radius: 14px; }
        .field-edit-actions { display:flex; gap:8px; margin-top:8px; }
      `}</style>

      <div className="relative p-5 bg-[var(--surface)] border border-gray-200 review-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{getTranslation('Review Your Request', selectedLanguage)}</h2>
            <p className="text-sm text-gray-500 mt-1">{getTranslation('A final look before submission', selectedLanguage)}</p>
          </div>
          <div className="text-xs text-gray-400">{new Date().toLocaleDateString()}</div>
        </div>

        {/* review border removed to avoid blocking content */}

        <div className="grid grid-cols-1 gap-4 border-b border-gray-200 pb-4">
          {/* Title (inline editable) */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">{getTranslation('TITLE', selectedLanguage)}</h3>
              {editingField !== 'title' ? (
                <button onClick={() => setEditingField('title')} className="text-gray-400 hover:text-gray-600"><Pencil className="w-4 h-4" /></button>
              ) : null}
            </div>
            {editingField === 'title' ? (
              <div>
                <input value={localValues.title} onChange={(e) => setLocalValues({ ...localValues, title: e.target.value })} className="w-full p-3 rounded-lg border border-gray-200 text-gray-900" />
                <div className="field-edit-actions">
                  <button onClick={() => saveLocalField('title')} className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white">{getTranslation('Save', selectedLanguage)}</button>
                  <button onClick={() => { setLocalValues(prev => ({ ...prev, title: title || '' })); setEditingField(null); }} className="px-3 py-2 rounded-lg border">{getTranslation('Cancel', selectedLanguage)}</button>
                </div>
              </div>
            ) : (
              <p className="text-lg font-semibold text-gray-900" aria-label="Request title">{localValues.title || title || `(${getTranslation('No title', selectedLanguage)})`}</p>
            )}
          </div>

          {/* Description (inline editable) */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">{getTranslation('DESCRIPTION', selectedLanguage)}</h3>
              {editingField !== 'description' ? (
                <button onClick={() => setEditingField('description')} className="text-gray-400 hover:text-gray-600"><Pencil className="w-4 h-4" /></button>
              ) : null}
            </div>
            {editingField === 'description' ? (
              <div>
                <textarea value={localValues.description} onChange={(e) => setLocalValues({ ...localValues, description: e.target.value })} rows={4} className="w-full p-3 rounded-lg border border-gray-200 text-gray-900" />
                <div className="field-edit-actions">
                  <button onClick={() => saveLocalField('description')} className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white">{getTranslation('Save', selectedLanguage)}</button>
                  <button onClick={() => { setLocalValues(prev => ({ ...prev, description: description || '' })); setEditingField(null); }} className="px-3 py-2 rounded-lg border">{getTranslation('Cancel', selectedLanguage)}</button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{localValues.description || description || `(${getTranslation('No description', selectedLanguage)})`}</p>
            )}
          </div>
        </div>

        {/* Secondary details */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <h3 className="text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">{getTranslation('FORMAT', selectedLanguage)}</h3>
            <p className="text-gray-900 font-medium capitalize">{getTranslation(selectedDeliveryType === 'one-time' ? 'One-Time' : (selectedDeliveryType ? selectedDeliveryType.charAt(0).toUpperCase() + selectedDeliveryType.slice(1) : ''), selectedLanguage) || localValues.delivery || '—'}</p>
          </div>
          <div>
            <h3 className="text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">{getTranslation('LENGTH', selectedLanguage)}</h3>
            <p className="text-gray-900">{getLengthLabel()}</p>
          </div>

          <div>
            <h3 className="text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">{getTranslation('PRIVACY', selectedLanguage)}</h3>
            <div className="flex items-center justify-between">
              <p className="text-gray-900">{getPrivacyLabel()}</p>
              <button onClick={() => setEditingField('privacy')} className="text-gray-400 hover:text-gray-600"><Pencil className="w-4 h-4" /></button>
            </div>
            {editingField === 'privacy' && (
              <div className="mt-2 flex gap-2">
                <button onClick={() => { setLocalValues(prev => ({ ...prev, privacy: 'public' })); saveLocalField('privacy'); }} className="px-3 py-1 rounded-lg border">{getTranslation('Public', selectedLanguage)}</button>
                <button onClick={() => { setLocalValues(prev => ({ ...prev, privacy: 'unlisted' })); saveLocalField('privacy'); }} className="px-3 py-1 rounded-lg border">{getTranslation('Unlisted', selectedLanguage)}</button>
                <button onClick={() => { setLocalValues(prev => ({ ...prev, privacy: 'private' })); saveLocalField('privacy'); }} className="px-3 py-1 rounded-lg border">{getTranslation('Private', selectedLanguage)}</button>
              </div>
            )}
          </div>

          <div className="col-span-2">
            <h3 className="text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">{getTranslation('BUDGET', selectedLanguage)}</h3>
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold">${Number(localValues.price || 0).toFixed(2)}</div>
              <button onClick={() => setEditingField('budget')} className="text-gray-400 hover:text-gray-600"><Pencil className="w-4 h-4" /></button>
            </div>
            {editingField === 'budget' && (
              <div className="mt-2 flex items-center gap-2">
                <input type="number" value={localValues.price} onChange={(e) => setLocalValues(prev => ({ ...prev, price: e.target.value }))} className="p-2 rounded-lg border" />
                <button onClick={() => saveLocalField('price')} className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white">{getTranslation('Save', selectedLanguage)}</button>
                <button onClick={() => { setLocalValues(prev => ({ ...prev, price: displayPrice || 0 })); setEditingField(null); }} className="px-3 py-2 rounded-lg border">{getTranslation('Cancel', selectedLanguage)}</button>
              </div>
            )}
          </div>
        </div>

        {/* Footer action */}
        <div className="mt-4">
          <button onClick={onEdit} className="text-sm text-gray-500 hover:text-gray-700 underline">{getTranslation('Edit Request', selectedLanguage)}</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Booking Page Component ---
const App = () => {
  const navigate = useNavigate();
  // Language State - Use global context
  const { selectedLanguage } = useLanguage();

  // Constants for text input
  const MAX_CHARS = 300;
  const MIN_CHARS = 10;
  const MIN_TITLE_CHARS = 5; // show Tone & Style after this many title chars

  // Form State
  const [selectedDeliveryType, setSelectedDeliveryType] = useState(null);
  const [deliveryDropdownOpen, setDeliveryDropdownOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // Added transition state
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search || "");
      // Prefer `q`, then legacy `term`, then `search` for compatibility
      return (
        params.get("q") || params.get("term") || params.get("search") || ""
      );
    } catch (e) {
      return "";
    }
  }); // Initialize title from ?q= (falls back to term/search)
  const [touchedDescription, setTouchedDescription] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // NEW STATES
  const [customVideoLength, setCustomVideoLength] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [referenceLinks, setReferenceLinks] = useState([]);

  // One-Time Flow State
  const [oneTimeStep, setOneTimeStep] = useState(1);

  // Recurrent Flow State
  const [recurrentStep, setRecurrentStep] = useState(1);
  const [selectedFrequency, setSelectedFrequency] = useState(null);
  const [customRecurrentDates, setCustomRecurrentDates] = useState([]); // New State

  // SERIES FLOW STATE
  const [seriesStep, setSeriesStep] = useState(1);
  const [numberOfEpisodes, setNumberOfEpisodes] = useState(5);
  const [selectedReleaseSchedule, setSelectedReleaseSchedule] = useState(null);
  const [customSeriesDates, setCustomSeriesDates] = useState([]); // New State

  // NEW CATALOGUE FLOW STATE
  const [catalogueStep, setCatalogueStep] = useState(1); // 1: Idea/Description, 2: Config, 3: Success
  const [targetVideos, setTargetVideos] = useState(0); // Default value: start at 0 so price shows $0.00
  // Allow overriding the calculated price with an editable custom price
  const [customPrice, setCustomPrice] = useState(null); // number in dollars, or null to use calc
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState("0.00");
  const priceInputRef = useRef(null);
  // Payment modal / pending submission state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(null); // { flow: 'one-time'|'series'|'recurrent'|'catalogue', nextStep: number }
  const [paymentAmount, setPaymentAmount] = useState(25); // default recommended preset (Most Popular)
  const [paymentRole, setPaymentRole] = useState("creator"); // 'creator' or 'expert'
  const [privacyCost, setPrivacyCost] = useState(0); // Additional cost for private/unlisted video ($5.99 for unlisted, $7.99 for private)
  const PAYMENT_PRESETS = [15, 25, 50, 100];
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [selectedCreatorImage, setSelectedCreatorImage] = useState(null); // Separate state for creator image
  const [creatorSearch, setCreatorSearch] = useState("");
  const [chooseCreatorExpanded, setChooseCreatorExpanded] = useState(false);
  const [chooseCreatorFocused, setChooseCreatorFocused] = useState(false);
  const [creatorSelectionType, setCreatorSelectionType] = useState(null); // 'specific' | 'any' | 'expert' | null
  const [showCreatorModal, setShowCreatorModal] = useState(false); // For the ideas page creator selection modal
  const [showFreeRequestSubmittedModal, setShowFreeRequestSubmittedModal] = useState(false); // For free request submission confirmation
  const [currentFreeRequest, setCurrentFreeRequest] = useState(null); // Store request data for sharing
  const [currentRequestIdForBoost, setCurrentRequestIdForBoost] = useState(null); // Track request ID for boost modal
  const [showBoostsModal, setShowBoostsModal] = useState(false); // For boost requests modal

  // When focus mode is toggled on, ensure the chooser is expanded and focus the input.
  useEffect(() => {
    if (chooseCreatorFocused) {
      setChooseCreatorExpanded(true);
      try {
        setTimeout(() => {
          if (chooseCreatorInputRef.current) chooseCreatorInputRef.current.focus();
        }, 80);
      } catch (e) { }
    }
  }, [chooseCreatorFocused]);

  // Show the Format / Examples section a short moment after the Tone section appears.
  const [showFormatSection, setShowFormatSection] = useState(false);
  const _showFormatTimer = useRef(null);
  const [showExamples, setShowExamples] = useState(false);
  const _showExamplesTimer = useRef(null);
  // Persist examples 'seen' flag so examples auto-appear only for first-time users
  const showExamplesOnce = () => {
    try {
      if (localStorage.getItem('ideas_examples_seen_v1')) return;
      setShowExamples(true);
      localStorage.setItem('ideas_examples_seen_v1', '1');
    } catch (e) { }
  };
  // Format-selection followups
  const [formatSelectedMessage, setFormatSelectedMessage] = useState(null);
  const [showFormatExamples, setShowFormatExamples] = useState(false);
  const _formatMessageTimer = useRef(null);
  const _formatExamplesTimer = useRef(null);
  // Delivery dropdown refs & timers for auto-open + focus (one-tap selection)
  const deliveryListRef = useRef(null);
  const deliveryAutoOpenTimer = useRef(null);
  const deliveryFocusTimer = useRef(null);

  // Auto-open delivery dropdown disabled — do not auto-open or auto-focus the list.
  useEffect(() => {
    return () => {
      if (deliveryAutoOpenTimer.current) { clearTimeout(deliveryAutoOpenTimer.current); deliveryAutoOpenTimer.current = null; }
      if (deliveryFocusTimer.current) { clearTimeout(deliveryFocusTimer.current); deliveryFocusTimer.current = null; }
    };
  }, [showExamples, selectedDeliveryType]);

  useEffect(() => {
    if (title && title.length >= MIN_TITLE_CHARS) {
      if (_showFormatTimer.current) clearTimeout(_showFormatTimer.current);
      _showFormatTimer.current = setTimeout(() => setShowFormatSection(true), 1000);
      // schedule examples to appear when the user scrolls near the format/delivery box
      // Prefer IntersectionObserver so examples reveal when the user approaches the control.
      if (_showExamplesTimer.current) {
        try {
          if (_showExamplesTimer.current instanceof IntersectionObserver) {
            _showExamplesTimer.current.disconnect();
          } else {
            clearTimeout(_showExamplesTimer.current);
          }
        } catch (e) { }
        _showExamplesTimer.current = null;
      }

      try {
        if (typeof IntersectionObserver !== "undefined" && deliveryListRef.current) {
          const obs = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  showExamplesOnce();
                  try { obs.disconnect(); } catch (e) { }
                  _showExamplesTimer.current = null;
                }
              });
            },
            { root: null, rootMargin: "0px 0px 400px 0px", threshold: 0 }
          );
          obs.observe(deliveryListRef.current);
          _showExamplesTimer.current = obs;
        } else {
          // Fallback: shorter delay (twice as fast as previous) so it appears earlier on browsers without IntersectionObserver
          _showExamplesTimer.current = setTimeout(() => showExamplesOnce(), 6100);
        }
      } catch (e) {
        // final fallback
        _showExamplesTimer.current = setTimeout(() => showExamplesOnce(), 6100);
      }
    } else {
      if (_showFormatTimer.current) {
        clearTimeout(_showFormatTimer.current);
        _showFormatTimer.current = null;
      }
      setShowFormatSection(false);
      if (_showExamplesTimer.current) {
        try {
          if (_showExamplesTimer.current instanceof IntersectionObserver) {
            _showExamplesTimer.current.disconnect();
          } else {
            clearTimeout(_showExamplesTimer.current);
          }
        } catch (e) { }
        _showExamplesTimer.current = null;
      }
      setShowExamples(false);
    }
    return () => {
      if (_showFormatTimer.current) {
        clearTimeout(_showFormatTimer.current);
        _showFormatTimer.current = null;
      }
      if (_showExamplesTimer.current) {
        try {
          if (_showExamplesTimer.current instanceof IntersectionObserver) {
            _showExamplesTimer.current.disconnect();
          } else {
            clearTimeout(_showExamplesTimer.current);
          }
        } catch (e) { }
        _showExamplesTimer.current = null;
      }
    };
  }, [title, MIN_TITLE_CHARS]);

  // When a delivery format is selected, show a short message then examples after delays
  useEffect(() => {
    if (selectedDeliveryType) {
      // clear any previous timers
      if (_formatMessageTimer.current) clearTimeout(_formatMessageTimer.current);
      if (_formatExamplesTimer.current) clearTimeout(_formatExamplesTimer.current);
      setFormatSelectedMessage(null);
      setShowFormatExamples(false);

      // show a short confirmation message after 1600ms
      _formatMessageTimer.current = setTimeout(() => {
        const map = {
          series: getTranslation("Series selected — now configure episode details.", selectedLanguage),
          catalogue: getTranslation("Catalogue selected — set target videos and themes.", selectedLanguage),
          recurrent: getTranslation("Recurrent selected — choose a delivery frequency.", selectedLanguage),
          "one-time": getTranslation("One-Time selected — next step: Tone & Style.", selectedLanguage),
        };
        setFormatSelectedMessage(map[selectedDeliveryType] || null);
      }, 400);

      // show examples for the chosen format a bit later (visible, note + edit)
      _formatExamplesTimer.current = setTimeout(() => {
        setShowFormatExamples(true);
      }, 4800);
    } else {
      if (_formatMessageTimer.current) clearTimeout(_formatMessageTimer.current);
      if (_formatExamplesTimer.current) clearTimeout(_formatExamplesTimer.current);
      _formatMessageTimer.current = null;
      _formatExamplesTimer.current = null;
      setFormatSelectedMessage(null);
      setShowFormatExamples(false);
    }
    return () => {
      if (_formatMessageTimer.current) { clearTimeout(_formatMessageTimer.current); _formatMessageTimer.current = null; }
      if (_formatExamplesTimer.current) { clearTimeout(_formatExamplesTimer.current); _formatExamplesTimer.current = null; }
    };
  }, [selectedDeliveryType]);

  // Inject shimmer / gradient CSS once so preview uses the same styles as other pages
  useEffect(() => {
    try {
      // Force update styles if they exist (hot-reload support)
      let style = document.getElementById('ideas-theme-styles');
      if (!style) {
        style = document.createElement('style');
        style.id = 'ideas-theme-styles';
        document.head.appendChild(style);
      }

      // Combine the global THEME_CSS (creator search, improved cards) with the specific local styles (animations, payment modal)
      // Note: We use THEME_CSS first, but ensure we don't accidentally override the specific payment modal parts if they differ.
      // Actually, we want the NEW creator search styles from THEME_CSS to take precedence or exist.

      const extraCss = `
        :root { --brand-gold: var(--color-gold); --color-gold-cream: rgba(255, 242, 199, 1); }
        @keyframes shimmer-gold-premium { 0% { background-position: 100% 0; } 40% { background-position: 0% 0; } 100% { background-position: 0% 0; } }
        .shimmer-gold { background: linear-gradient(100deg, var(--color-gold) 0%, var(--color-gold) 42%, var(--color-gold-cream) 45%, var(--color-gold-cream) 55%, var(--color-gold) 58%, var(--color-gold) 100%); background-size: 300% 100%; animation: shimmer-gold-premium 3s ease-in-out infinite; }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 var(--color-gold); } 70% { box-shadow: 0 0 0 12px rgba(0,0,0,0); } 100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); } }
        .pulse-price { animation: pulse-ring 2.2s infinite; }

        /* Sweeping text: white overlay that passes over the heading without tinting it. */
        .sweeping-text-container { position: relative; display: inline-block; overflow: hidden; z-index: 1; }
        .sweep-effect { position: absolute; top: 0; left: -40%; height: 100%; width: 60%; pointer-events: none; border-radius: 8px;
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 100%);
            mix-blend-mode: normal; transform: translateX(0); animation: sweep-anim 2000ms ease-in-out forwards; z-index: 0; }
        @keyframes sweep-anim { 0% { transform: translateX(-120%); opacity: 0; } 8% { opacity: 1; } 85% { transform: translateX(120%); opacity: 1; } 100% { transform: translateX(120%); opacity: 0; } }
        
        /* Ensure the Ideas page elements adopt the page background so inputs and panels blend */
        .ideas-root .bg-white { background-color: var(--surface) !important; box-shadow: none !important; }
        .ideas-root input, .ideas-root textarea, .ideas-root select, .ideas-root .rounded-xl, .ideas-root .rounded-2xl { background-color: #F8F8FA !important; }
        .ideas-root .border-gray-200 { border-color: rgba(15,23,42,0.06) !important; }

        .ideas-root h2, .ideas-root h3, .ideas-root h4, .ideas-root h5, .ideas-root .text-lg, .ideas-root .text-xl, .ideas-root .text-2xl, .ideas-root input, .ideas-root textarea, .ideas-root label {
          font-size: 1rem !important;
          line-height: 1.2 !important;
        }

        /* Exclude the main animated page title (keeps its larger size) */
        .ideas-root .cream-glow-box h1 { font-size: clamp(20px, 6.5vw, 34px) !important; line-height: 1.1 !important; }
        
        /* Payment modal revamp styles - CLASSY & PREMIUM */
        .payment-modal-panel { background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid rgba(15,23,42,0.04); box-shadow: 0 40px 80px -12px rgba(0, 0, 0, 0.12); width: 100%; max-width: 550px; margin: auto; }
        .payment-modal-header { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin-bottom: 24px; }
        .payment-modal-title { font-size:24px; font-weight:800; letter-spacing: -0.02em; color: #1e293b; margin:0; line-height: 1.2; }
        .payment-modal-sub { color:#64748b; font-size:15px; margin-top:8px; line-height: 1.6; }
        
        .preset-row { display:flex; gap:16px; align-items:center; flex-wrap:wrap; margin-bottom: 24px; }
        .preset-btn { flex: 1; min-width:110px; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:16px 20px; border-radius:16px; font-weight:700; cursor:pointer; border:1px solid rgba(15,23,42,0.04); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-size: 18px; }
        .preset-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .preset-btn:active { transform: translateY(0); }
        
        .preset-btn.bg-primary { background: linear-gradient(135deg, var(--color-primary), #7a3af0); color:white; box-shadow: 0 12px 25px -8px rgba(122,58,240,0.4); border: none; }
        .preset-btn.bg-gray { background:#f8fafc; color:#0f172a; border-color: #e2e8f0; }
        
        .amount-row { display:flex; align-items:center; justify-content:space-between; gap:16px; background: #f8fafc; padding: 16px 20px; border-radius: 16px; margin-bottom: 24px; }
        .amount-input { width:120px; padding:12px 16px; border-radius:12px; border:1px solid rgba(15,23,42,0.08); font-size: 18px; font-weight: 600; text-align: right; }
        
        .payment-cta { display:inline-flex; align-items:center; justify-content:center; gap:12px; padding:18px 32px; border-radius:18px; background: linear-gradient(135deg, var(--color-primary), #7a3af0); color:white; font-size: 18px; font-weight:800; box-shadow: 0 20px 40px -10px rgba(122,58,240,0.3); border: none; cursor: pointer; transition: all 0.3s ease; text-decoration: none; }
        .payment-cta:hover { transform: translateY(-2px); box-shadow: 0 25px 50px -12px rgba(122,58,240,0.4); }
        
        .modal-trust { display:flex; align-items:center; justify-content: center; gap:8px; color:#64748b; font-size:13px; margin-top:20px; font-weight: 500; }
        
        /* Provider list improvements */
        .provider-item { padding:14px 18px; border-radius:14px; border:1px solid transparent; cursor:default; transition: background 0.2s; }
        .provider-item.highlight { border-color: rgba(122,58,240,0.12); background: rgba(122,58,240,0.03); }
        .payment-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:18px; }
        
        input[type=range] {
          -webkit-appearance: none; appearance: none; width: 100%; height: 8px; background: linear-gradient(90deg, rgba(15,23,42,0.06), rgba(15,23,42,0.04)); border-radius: 999px;
        }
        input[type=range]::-webkit-slider-runnable-track { height: 8px; border-radius: 999px; background: linear-gradient(90deg, rgba(15,23,42,0.06), rgba(15,23,42,0.04)); }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; margin-top: -5px; background: linear-gradient(90deg, var(--color-primary), #7a3af0); box-shadow: 0 8px 20px rgba(122,58,240,0.18); border: 3px solid #fff; }
        input[type=range]::-moz-range-track { height: 8px; border-radius: 999px; background: linear-gradient(90deg, rgba(15,23,42,0.06), rgba(15,23,42,0.04)); }
        input[type=range]::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: linear-gradient(90deg, var(--color-primary), #7a3af0); box-shadow: 0 8px 20px rgba(122,58,240,0.18); border: 3px solid #fff; }
      `;

      // Inject updated styles: THEME_CSS (search bar fixes) + extraCss (modal stuff)
      style.textContent = THEME_CSS + extraCss;
    } catch (e) {
      // ignore
    }
  }, []);
  const chooseCreatorInputRef = useRef(null);
  // Creators list: fetched from backend when chooser expands; do NOT show
  // demo placeholders by default — use empty fallback so only real backend
  // creators appear in the chooser.
  const CREATORS_SAMPLE = [];

  const [creatorsList, setCreatorsList] = useState([]);
  const BACKEND = (function() {
      if (window && window.__BACKEND_URL__) return window.__BACKEND_URL__;
      return 'https://regaarder-pwin.onrender.com';
  })();

  // Helper: normalize image URLs (uploaded: prefix → full backend URL, http→https)
  const normalizeCreatorImage = (url) => {
    if (!url) return null;
    let s = String(url);
    if (s.startsWith('uploaded:')) {
      const filename = s.split(':')[1] || s.slice('uploaded:'.length);
      return `${BACKEND}/uploads/${filename}`;
    }
    // Fix http → https for backend URLs
    if (s.startsWith('http://') && s.includes('onrender.com')) {
      s = s.replace('http://', 'https://');
    }
    return s;
  };

  const getRandomColor = () => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Map raw user/creator data to normalized creator object
  const mapToCreator = (u) => ({
    id: u.id || u.email || u.name,
    name: u.name || u.handle || u.tag || 'Unknown',
    displayName: u.name || u.handle || u.tag || 'Unknown',
    handle: u.handle || u.tag || '',
    email: u.email || null,
    photoURL: normalizeCreatorImage(u.photoURL || u.image || u.avatar),
    image: normalizeCreatorImage(u.image || u.photoURL || u.avatar),
    price: u.price || u.rate || 0,
    followers: u.followers || u.followers_count || 0,
    fallbackColor: getRandomColor()
  });

  // Shared fetch function for loading creators with multiple fallbacks
  const fetchCreatorsFromBackend = async (signal) => {
    try {
      // Strategy 1: Try new /creators endpoint (extracts from videos + users)
      try {
        const creatorsRes = await fetch(`${BACKEND}/creators`, { signal });
        if (creatorsRes.ok) {
          const creatorsJson = await creatorsRes.json();
          const arr = creatorsJson.creators || creatorsJson.users || [];
          if (arr.length > 0) {
            console.log('[ideas] Got', arr.length, 'creators from /creators endpoint');
            return arr.map(mapToCreator);
          }
        }
      } catch (e1) {
        if (e1.name === 'AbortError') return [];
        console.warn('[ideas] /creators failed, trying /users', e1.message);
      }

      // Strategy 2: Try /users endpoint
      try {
        const res = await fetch(`${BACKEND}/users`, { signal });
        if (res.ok) {
          const json = await res.json();
          const allUsers = json.users || [];
          if (allUsers.length > 0) {
            // Handle both isCreator and is_creator field names
            let creators = allUsers.filter(u => u.isCreator === true || u.is_creator === true);
            if (creators.length === 0) creators = allUsers; // If no creator flag, show all
            console.log('[ideas] Got', creators.length, 'creators from /users endpoint');
            return creators.map(mapToCreator);
          }
        }
      } catch (e2) {
        if (e2.name === 'AbortError') return [];
        console.warn('[ideas] /users failed, trying /videos', e2.message);
      }

      // Strategy 3: Extract unique creators from /videos endpoint (guaranteed to work)
      try {
        const vRes = await fetch(`${BACKEND}/videos`, { signal });
        if (vRes.ok) {
          const vJson = await vRes.json();
          const videos = vJson.videos || (Array.isArray(vJson) ? vJson : []);
          const creatorMap = new Map();
          videos.forEach(v => {
            const authorId = v.authorId || v.creatorId || v.userId;
            const authorName = v.author || v.creator || v.channel;
            if (!authorId && !authorName) return;
            const key = (authorId || authorName || '').toLowerCase();
            if (!creatorMap.has(key)) {
              creatorMap.set(key, {
                id: authorId || `video-${key}`,
                name: authorName || 'Unknown',
                image: v.authorImage || v.creatorImage || null,
                handle: v.authorHandle || '',
                email: authorId && authorId.includes('@') ? authorId : null,
                isCreator: true,
              });
            }
          });
          // For each creator found in videos, try to enrich with user profile data
          const creators = [];
          for (const [, creator] of creatorMap) {
            try {
              const lookupId = creator.email || creator.id || creator.name;
              const userRes = await fetch(`${BACKEND}/users/${encodeURIComponent(lookupId)}`, { signal });
              if (userRes.ok) {
                const userData = await userRes.json();
                const u = userData.user || userData;
                if (u && !u.isPlaceholder) {
                  creators.push(mapToCreator({ ...creator, ...u, isCreator: true }));
                  continue;
                }
              }
            } catch (e) { /* skip enrichment for this creator */ }
            creators.push(mapToCreator(creator));
          }
          console.log('[ideas] Got', creators.length, 'creators from /videos fallback');
          return creators;
        }
      } catch (e3) {
        if (e3.name === 'AbortError') return [];
        console.warn('[ideas] /videos fallback also failed', e3.message);
      }

      return [];
    } catch (e) {
      if (e.name === 'AbortError') return [];
      console.warn('fetchCreatorsFromBackend error', e);
      return [];
    }
  };

  // Eagerly fetch creators on mount so they're ready for any search UI
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    fetchCreatorsFromBackend(controller.signal).then(creators => {
      clearTimeout(timer);
      if (!cancelled && creators.length > 0) {
        console.log('[ideas] Setting creatorsList with', creators.length, 'creators');
        setCreatorsList(creators);
      }
    });
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); };
  }, []);

  // Handle return from payment provider
  useEffect(() => {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('payment_success') === 'true') {
            const raw = localStorage.getItem('pending_payment_data');
            
            // Clean URL first
            const url = new URL(window.location.href);
            url.searchParams.delete('payment_success');
            url.searchParams.delete('session_id');
            window.history.replaceState({}, '', url);

            // If we have pending data that wasn't synced to backend, try to sync it now
            if (raw) {
              try {
                const data = JSON.parse(raw);
                if (!data.backendSynced) {
                   console.log('[payment_success] Syncing pending submission');
                   continuePendingSubmission(data.amount || 0, data).then(() => {
                      console.log('[payment_success] Sync complete');
                      localStorage.removeItem('pending_payment_data');
                      // CRITICAL FIX #3: Ensure navigation happens after sync with error handling
                      setTimeout(() => {
                        try {
                           navigate('/requests?filter=For You');
                        } catch (e) {
                           window.location.href = '/requests?filter=For You';
                        }
                      }, 150);
                   }).catch((err) => {
                      console.error('[payment_success] Sync failed:', err);
                      localStorage.removeItem('pending_payment_data');
                      setTimeout(() => {
                        try {
                           navigate('/requests?filter=For You');
                        } catch (e) {
                           window.location.href = '/requests?filter=For You';
                        }
                      }, 150);
                   });
                   return; 
                }
              } catch(e) {}
              // cleanup storage
              localStorage.removeItem('pending_payment_data');
            }

            // Redirect to requests page immediately (fallback if no pending data found)
            setTimeout(() => {
                try {
                   navigate('/requests?filter=For You');
                } catch (e) {
                   window.location.href = '/requests?filter=For You';
                }
            }, 300);
        }
    } catch(e) { console.warn('Failed to handle payment return', e); }
  }, []);

  // Load selectedCreator from localStorage when component mounts or when notified
  useEffect(() => {
    const SELECTED_CREATOR_KEY = 'ideas_selectedCreator_v1';
    const checkLocalStorage = () => {
        try {
            const stored = localStorage.getItem(SELECTED_CREATOR_KEY);
            if (stored) {
                const creatorObj = JSON.parse(stored);
                setSelectedCreator(creatorObj);
                const rawImg = creatorObj.photoURL || creatorObj.image;
                if (rawImg) {
                    setSelectedCreatorImage(normalizeCreatorImage(rawImg));
                }
                // Set minimum payment amount based on creator's price
                const minAmount = (creatorObj.price && Number(creatorObj.price) > 0) ? Math.max(15, Number(creatorObj.price)) : 15;
                setPaymentAmount(minAmount);
                // Clear from localStorage so it doesn't persist across sessions
                localStorage.removeItem(SELECTED_CREATOR_KEY);
            }
        } catch (e) {
            console.warn('Failed to load selected creator', e);
        }
    };

    // Check immediately on mount
    checkLocalStorage();

    // Also listen for event in case we are already mounted (SPA navigation)
    const handler = () => checkLocalStorage();
    window.addEventListener('ideas:creator_selected', handler);
    return () => window.removeEventListener('ideas:creator_selected', handler);
  }, []);

  // Re-fetch creators when chooser expands OR payment modal opens OR a creator was selected (if not already loaded)
  useEffect(() => {
    let cancelled = false;
    if ((chooseCreatorExpanded || paymentModalOpen || (selectedCreator && selectedCreator.id)) && creatorsList.length === 0) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      fetchCreatorsFromBackend(controller.signal).then(creators => {
        clearTimeout(timer);
        if (!cancelled && creators.length > 0) setCreatorsList(creators);
      });
      return () => { cancelled = true; controller.abort(); clearTimeout(timer); };
    }
  }, [chooseCreatorExpanded, paymentModalOpen, selectedCreator?.id]);

  // Filter creators by search text - match against name, displayName, and handle
  const filteredCreators = (() => {
    const raw = String(creatorSearch || "").trim();
    if (!raw) return creatorsList;
    const query = raw.replace(/^@+/, '').toLowerCase();
    if (!query) return creatorsList;
    return creatorsList.filter((c) => {
      const cName = String(c.name || '').toLowerCase();
      const cDisplay = String(c.displayName || '').toLowerCase();
      const cHandle = String(c.handle || '').toLowerCase();
      return cName.includes(query) || cDisplay.includes(query) || cHandle.includes(query);
    });
  })();

  // Prevent background scroll and ensure backdrop covers everything when payment modal is open
  useEffect(() => {
    try {
      if (paymentModalOpen) {
        // lock background scroll
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";
      } else {
        document.body.style.overflow = "";
        document.body.style.touchAction = "";
      }
    } catch (e) {
      // ignore in non-browser env
    }

    return () => {
      try {
        document.body.style.overflow = "";
        document.body.style.touchAction = "";
      } catch (e) { }
    };
  }, [paymentModalOpen]);

  // Lightweight analytics hook (replace with real analytics integration)
  const trackEvent = (eventName, payload = {}) => {
    try {
      // Placeholder for real analytics; keep concise logs for debugging
      console.log("[analytics]", eventName, payload);
    } catch (e) {
      /* ignore */
    }
  };

  // Focus the choose-creator input when the chooser expands
  useEffect(() => {
    if (chooseCreatorExpanded) {
      // Clear search to show ALL creators by default
      setCreatorSearch("");

      setTimeout(() => {
        if (chooseCreatorInputRef.current)
          chooseCreatorInputRef.current.focus();
      }, 240);
    }
  }, [chooseCreatorExpanded]);

  // Re-fetch creators when the ideas page modal opens (if not already loaded)
  useEffect(() => {
    let cancelled = false;
    if (showCreatorModal && creatorsList.length === 0) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      fetchCreatorsFromBackend(controller.signal).then(creators => {
        clearTimeout(timer);
        if (!cancelled && creators.length > 0) setCreatorsList(creators);
      });
      return () => { cancelled = true; controller.abort(); clearTimeout(timer); };
    }
  }, [showCreatorModal]);

  // Keep expanded state in sync with focus mode so entering focus always expands
  // useEffect(() => {
  //   if (chooseCreatorFocused && !chooseCreatorExpanded) setChooseCreatorExpanded(true);
  //   if (!chooseCreatorFocused && chooseCreatorExpanded) setChooseCreatorExpanded(false);
  // }, [chooseCreatorFocused, chooseCreatorExpanded]);

  // Derived display price: either custom override or default to 0
  // NOTE: keep default at $0.00 unless the user explicitly edits the price
  const displayPrice = typeof customPrice === "number" ? customPrice : 0;

  useEffect(() => {
    if (editingPrice) {
      setPriceInput((displayPrice || 0).toFixed(2));
      setTimeout(() => {
        if (priceInputRef.current) priceInputRef.current.focus();
      }, 0);
    }
  }, [editingPrice]);

  // Format an integer/decimal string with thousand separators for the input
  const formatWithCommas = (numStr) => {
    if (!numStr) return "";
    const [intPart, decPart] = numStr.split(".");
    const intClean = intPart.replace(/^0+(?=\d)/, "") || "0";
    const intFormatted = intClean.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted;
  };

  const sanitizePriceInput = (raw) => {
    if (raw == null) return "";
    // Remove everything except digits and dot
    let v = String(raw).replace(/[^0-9.]/g, "");
    // Keep only first dot
    const parts = v.split(".");
    if (parts.length > 1) {
      v = parts[0] + "." + parts.slice(1).join("");
    }
    // Limit to 2 decimal places for fractional part
    if (v.includes(".")) {
      const [a, b] = v.split(".");
      const dec = (b || "").slice(0, 2);
      return formatWithCommas(a) + (dec.length ? `.${dec}` : ".");
    }
    return formatWithCommas(v);
  };

  const formatNumberToInput = (num) => {
    if (num == null || isNaN(num)) return "";
    // Force two decimals for stored/input initial value
    const fixed = Number(num).toFixed(2);
    const [intPart, dec] = fixed.split(".");
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + dec;
  };

  const savePrice = () => {
    const parsed = parseFloat(
      String(priceInput || "")
        .replace(/,/g, "")
        .replace(/[^0-9.-]/g, "")
    );
    const final = isNaN(parsed) ? 0 : parsed;
    setCustomPrice(final);
    setPriceInput(formatNumberToInput(final));
    setEditingPrice(false);
  };
  // Toast helper for small confirmations
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    try {
      setToastMessage(msg);
    } catch (e) { }
  };
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(""), 8000);
    return () => clearTimeout(t);
  }, [toastMessage]);
  // Save creator from the freeform input (either save and close or keep open)
  const saveCreatorFromInput = (close = true) => {
    try {
      const raw = String(creatorSearch || "").trim();
      if (!raw) return;
      const id = raw.replace(/^@+/, "").toLowerCase();
      if (!id) return;
      const c = { id, name: "@" + id };
      setSelectedCreator(c);
      setPaymentRole("creator");
      trackEvent("creator_saved", { creatorId: id, source: "manual" });
      showToast(`Saved ${c.name}`);
      // After saving, close only the chooser (expand/focus), keep the payment modal open
      setChooseCreatorExpanded(false);
      setChooseCreatorFocused(false);
      try {
        window.localStorage.setItem(SELECTED_CREATOR_KEY, JSON.stringify(c));
      } catch (e) { }
    } catch (e) {
      // ignore
    }
  };
  // Persist customPrice to localStorage so edits survive reloads
  const PRICE_STORAGE_KEY = "ideas_customPrice_v1";
  // Persist selected creator across openings/reloads
  const SELECTED_CREATOR_KEY = "ideas_selectedCreator_v1";

  // Load persisted price on first mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PRICE_STORAGE_KEY);
      if (raw != null) {
        const parsed = parseFloat(raw);
        if (!isNaN(parsed)) {
          setCustomPrice(parsed);
          setPriceInput(parsed.toFixed(2));
        }
      }
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  // Load persisted selected creator on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SELECTED_CREATOR_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) {
          console.log('[ideas] loaded selectedCreator from localStorage:', parsed);
          setSelectedCreator(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Also re-read persisted selection when the page becomes visible/focused.
  // This covers client-side navigations / modal flows where the component
  // may already be mounted but localStorage was updated by another view.
  useEffect(() => {
    const readSelected = () => {
      try {
        if (selectedCreator && selectedCreator.id) return; // already set
        const raw = window.localStorage.getItem(SELECTED_CREATOR_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) {
          console.log('[ideas] pageshow/focus read selectedCreator from localStorage:', parsed);
          setSelectedCreator(parsed);
        }
      } catch (e) {
        // ignore
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') readSelected();
    };

    window.addEventListener('pageshow', readSelected);
    window.addEventListener('focus', readSelected);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('pageshow', readSelected);
      window.removeEventListener('focus', readSelected);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [selectedCreator]);

  // Enrich selectedCreator with image data from backend if it's missing
  useEffect(() => {
    if (!selectedCreator || !selectedCreator.id) {
      return; // No selectedCreator
    }
    
    if (selectedCreator.photoURL || selectedCreator.image || selectedCreator.avatar) {
      return; // Already has image data
    }

    // Use /users/:id (which works) instead of /users (which may return empty)
    const enrichCreatorData = async () => {
      try {
        console.log('[ideas] Enriching selectedCreator with image data...', selectedCreator.id);
        // Try looking up by id, then email, then name
        const lookupIds = [
          selectedCreator.id,
          selectedCreator.email,
          selectedCreator.displayName || String(selectedCreator.name || '').replace(/^@/, '')
        ].filter(Boolean);

        for (const lookupId of lookupIds) {
          try {
            const res = await fetch(`${BACKEND}/users/${encodeURIComponent(lookupId)}`);
            if (!res.ok) continue;
            const json = await res.json();
            const u = json.user || json;
            if (u && !u.isPlaceholder) {
              const imageUrl = normalizeCreatorImage(u.photoURL || u.image || u.avatar);
              console.log('[ideas] Enriched creator image from /users/:id:', imageUrl);
              if (imageUrl) {
                setSelectedCreator(prev => ({
                  ...prev,
                  photoURL: imageUrl,
                  image: imageUrl,
                  followers: u.followers || u.followers_count || prev.followers || 0,
                  price: u.price || prev.price || 0,
                }));
              }
              return; // Found it, stop trying
            }
          } catch (e) { /* try next */ }
        }
        console.warn('[ideas] Could not enrich creator data for', selectedCreator.id);
      } catch (e) {
        console.warn('Failed to enrich creator data with image', e);
      }
    };

    enrichCreatorData();
  }, [selectedCreator?.id]);

  // Fetch selectedCreatorImage whenever selectedCreator changes
  useEffect(() => {
    if (!selectedCreator || !selectedCreator.id) {
      setSelectedCreatorImage(null);
      return;
    }

    // If selectedCreator already has image data, use it
    if (selectedCreator.photoURL || selectedCreator.image || selectedCreator.avatar) {
      const normalized = normalizeCreatorImage(selectedCreator.photoURL || selectedCreator.image || selectedCreator.avatar);
      console.log('[ideas] Using image from selectedCreator:', normalized);
      setSelectedCreatorImage(normalized);
      return;
    }

    // Otherwise fetch from backend using /users/:id (reliable)
    const fetchCreatorImage = async () => {
      try {
        console.log('[ideas] selectedCreator missing image, fetching via /users/:id...');
        const lookupId = selectedCreator.email || selectedCreator.id || String(selectedCreator.displayName || selectedCreator.name || '').replace(/^@/, '');
        const res = await fetch(`${BACKEND}/users/${encodeURIComponent(lookupId)}`);
        if (!res.ok) return;
        const json = await res.json();
        const creator = json.user || json;
        
        if (creator && !creator.isPlaceholder) {
          const imgUrl = normalizeCreatorImage(creator.image || creator.photoURL || creator.avatar);
          console.log('[ideas] Found creator image via /users/:id:', imgUrl);
          setSelectedCreatorImage(imgUrl || null);
        } else {
          // Also try in creatorsList
          if (creatorsList.length > 0) {
            const fromList = creatorsList.find(c => c.id === selectedCreator.id || c.email === selectedCreator.id);
            if (fromList) {
              const img = normalizeCreatorImage(fromList.photoURL || fromList.image);
              if (img) setSelectedCreatorImage(img);
            }
          }
          console.warn('[ideas] Creator not found via /users/:id');
        }
      } catch (e) {
        console.warn('[ideas] Failed to fetch creator image:', e);
      }
    };

    fetchCreatorImage();
  }, [selectedCreator?.id]);

  // When creatorsList loads, try to find image for selectedCreator if still missing
  useEffect(() => {
    if (!selectedCreator || !selectedCreator.id || selectedCreatorImage) return;
    if (creatorsList.length === 0) return;
    const creatorFromList = creatorsList.find(c => c.id === selectedCreator.id);
    if (creatorFromList && (creatorFromList.photoURL || creatorFromList.image)) {
      const img = normalizeCreatorImage(creatorFromList.photoURL || creatorFromList.image);
      if (img) setSelectedCreatorImage(img);
    }
  }, [creatorsList, selectedCreator?.id, selectedCreatorImage]);

  // If we arrived with a selected creator, auto-scroll and focus the description textarea once
  useEffect(() => {
    try {
      if (selectedCreator && descriptionRef.current && !_autoScrollDone.current) {
        setTimeout(() => {
          try {
            descriptionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            descriptionRef.current.focus({ preventScroll: true });
            _autoScrollDone.current = true;
            console.log('[ideas] auto-scrolled to description for selectedCreator');
          } catch (e) { console.warn('auto-scroll failed', e); }
        }, 120);
      }
    } catch (e) { }
  }, [selectedCreator]);

  // Save persisted price whenever customPrice changes (or remove when null)
  useEffect(() => {
    try {
      if (typeof customPrice === "number") {
        window.localStorage.setItem(PRICE_STORAGE_KEY, String(customPrice));
      } else {
        window.localStorage.removeItem(PRICE_STORAGE_KEY);
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [customPrice]);

  // Persist selected creator whenever it changes
  useEffect(() => {
    try {
      if (selectedCreator && selectedCreator.id) {
        window.localStorage.setItem(
          SELECTED_CREATOR_KEY,
          JSON.stringify(selectedCreator)
        );
      } else {
        window.localStorage.removeItem(SELECTED_CREATOR_KEY);
      }
    } catch (e) {
      // ignore
    }
  }, [selectedCreator]);
  const [themes, setThemes] = useState(""); // Default value

  // TONE & STYLE STATE (Shared)
  const [selectedTones, setSelectedTones] = useState([]);
  // STYLE state (separate picker)
  const [selectedStyles, setSelectedStyles] = useState([]);

  // VIDEO LENGTH STATE (Shared)
  const [selectedVideoLength, setSelectedVideoLength] = useState(null);

  // PRIVACY STATE (Shared)
  const [selectedPrivacy, setSelectedPrivacy] = useState(null);

  // Update privacy cost based on selected privacy level
  useEffect(() => {
    const privacyCosts = {
      public: 0,
      unlisted: 5.99,
      private: 7.99,
    };
    setPrivacyCost(privacyCosts[selectedPrivacy] || 0);
  }, [selectedPrivacy]);

  const [activeNav, setActiveNav] = useState("Ideas");
  // Modal state for floating preview (toggled by floating "See preview" button)
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [showCreatorProfile, setShowCreatorProfile] = useState(false);
  const [profileCreator, setProfileCreator] = useState(null);

  // Derived state for overall selection status (Only checks if *a* type is selected)
  const isFormatSelected = selectedDeliveryType !== null;

  // Delivery Options Data (Unchanged)
  const deliveryOptions = [
    {
      type: "one-time",
      title: getTranslation("One-Time", selectedLanguage),
      subtitle: getTranslation("A single standalone video.", selectedLanguage),
      Icon: Film,
    },
    {
      type: "recurrent",
      title: getTranslation("Recurrent", selectedLanguage),
      subtitle: getTranslation("A routine delivered daily, weekly, or monthly.", selectedLanguage),
      Icon: Repeat,
    },
    {
      type: "series",
      title: getTranslation("Series", selectedLanguage),
      subtitle: getTranslation("A focused set of connected videos.", selectedLanguage),
      Icon: ListVideo,
    },
    {
      type: "catalogue",
      title: getTranslation("Catalogue", selectedLanguage),
      subtitle: getTranslation("A curated mix across different themes.", selectedLanguage),
      Icon: Folder,
    },
  ];

  // Title Animation State (Unchanged)
  const titles = [getTranslation('Book Your Next Videos', selectedLanguage)];
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [titleVisible, setTitleVisible] = useState(true);
  const [sweepActive, setSweepActive] = useState(false);
  const titleBoxRef = useRef(null);
  const descriptionRef = useRef(null);
  const _autoScrollDone = useRef(false);
  const [titleBoxWidth, setTitleBoxWidth] = useState(null);
  const [titleGradient, setTitleGradient] = useState(null);

  // Animation Constants (milliseconds) (Unchanged)
  const SWEEP_DURATION = 8000;
  const FADE_DURATION = 2000;
  const SWEEP_START_DELAY = 400;

  // --- Title Animation Logic (reliable timer-based) ---
  useEffect(() => {
    if (!titles || titles.length < 2) return undefined;

    const TOTAL_CYCLE = SWEEP_START_DELAY + SWEEP_DURATION + FADE_DURATION; // ms
    let intervalId = null;
    let sweepOnTimeout = null;
    let sweepOffTimeout = null;

    const startCycle = () => {
      // ensure title is visible at cycle start
      setTitleVisible(true);

      // start sweep shortly after
      sweepOnTimeout = setTimeout(() => setSweepActive(true), SWEEP_START_DELAY);

      // stop sweep after sweep duration (fade will follow)
      sweepOffTimeout = setTimeout(() => {
        setSweepActive(false);
        setTitleVisible(false);
      }, SWEEP_START_DELAY + SWEEP_DURATION);
    };

    // kick off initial cycle and set interval to rotate titles
    startCycle();
    intervalId = setInterval(() => {
      setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
      // restart sweep for the new title
      startCycle();
    }, TOTAL_CYCLE);

    return () => {
      clearInterval(intervalId);
      clearTimeout(sweepOnTimeout);
      clearTimeout(sweepOffTimeout);
    };
  }, [titles.length]);

  // Keep track of the title box width so related elements (time pill) can match it
  useEffect(() => {
    const update = () => {
      try {
        if (titleBoxRef.current) {
          setTitleBoxWidth(titleBoxRef.current.offsetWidth);
        }
      } catch (e) { }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [titleVisible, currentTitleIndex]);

  // Compute a gradient based on the active accent color variables so the title
  // fully reflects whatever accent the app/theme applies.
  useEffect(() => {
    try {
      const primary = getCssVar('--color-gold') || getCssVar('--brand-gold') || '#CA8A04';
      const secondary = getCssVar('--color-gold-600') || getCssVar('--brand-gold-600') || '#B27000';
      setTitleGradient(`linear-gradient(90deg, ${primary}, ${secondary})`);
    } catch (e) {
      setTitleGradient('linear-gradient(90deg, #CA8A04, #B27000)');
    }
  }, []);

  // --- Next Button Enablement Logic ---
  const isRecurrent = selectedDeliveryType === "recurrent";
  const isSeries = selectedDeliveryType === "series";
  const isCatalogue = selectedDeliveryType === "catalogue"; // NEW
  let isNextEnabled = false;

  if (selectedDeliveryType === "one-time") {
    if (oneTimeStep === 1) {
      isNextEnabled =
        description.length >= MIN_CHARS && title.trim().length > 0;
    } else if (oneTimeStep === 2) {
      isNextEnabled = true; // Tone step
    } else if (oneTimeStep === 3) {
      isNextEnabled = true; // Length step
    } else if (oneTimeStep === 4) {
      isNextEnabled = selectedPrivacy !== null; // Privacy step (moved earlier)
    } else if (oneTimeStep === 5) {
      isNextEnabled = true; // Review step
    } else {
      isNextEnabled = false;
    }
  } else if (isRecurrent) {
    if (recurrentStep === 1) {
      isNextEnabled =
        description.length >= MIN_CHARS && title.trim().length > 0;
    } else if (recurrentStep === 2) {
      if (selectedFrequency === "custom") {
        isNextEnabled = customRecurrentDates.length > 0;
      } else {
        isNextEnabled = selectedFrequency !== null;
      }
    } else if (recurrentStep === 3) {
      isNextEnabled = true; // Tone step
    } else if (recurrentStep === 4) {
      isNextEnabled = true; // Length step
    } else if (recurrentStep === 5) {
      isNextEnabled = selectedPrivacy !== null; // Privacy step (moved earlier)
    } else if (recurrentStep === 6) {
      isNextEnabled = true; // Review step
    } else {
      isNextEnabled = false;
    }
  } else if (isSeries) {
    if (seriesStep === 1) {
      isNextEnabled =
        description.length >= MIN_CHARS && title.trim().length > 0;
    } else if (seriesStep === 2) {
      if (selectedReleaseSchedule === "custom") {
        isNextEnabled = numberOfEpisodes >= 1 && customSeriesDates.length > 0;
      } else {
        isNextEnabled =
          numberOfEpisodes >= 1 && selectedReleaseSchedule !== null;
      }
    } else if (seriesStep === 3) {
      isNextEnabled = true; // Tone step
    } else if (seriesStep === 4) {
      isNextEnabled = true; // Length step
    } else if (seriesStep === 5) {
      isNextEnabled = selectedPrivacy !== null; // Privacy step (moved earlier)
    } else if (seriesStep === 6) {
      isNextEnabled = true; // Review step
    } else if (seriesStep === 7) {
      isNextEnabled = false;
    }
  } else if (isCatalogue) {
    // NEW CATALOGUE LOGIC
    if (catalogueStep === 1) {
      isNextEnabled =
        description.length >= MIN_CHARS && title.trim().length > 0; // Enables going to Step 2
    } else if (catalogueStep === 2) {
      isNextEnabled = targetVideos >= 1; // Enables final submission
    } else if (catalogueStep === 3) {
      isNextEnabled = true; // Tone step
    } else if (catalogueStep === 4) {
      isNextEnabled = true; // Length step
    } else if (catalogueStep === 5) {
      isNextEnabled = selectedPrivacy !== null; // Privacy step (moved earlier)
    } else if (catalogueStep === 6) {
      isNextEnabled = true; // Review step
    } else if (catalogueStep === 7) {
      isNextEnabled = false; // Submission complete
    }
  }

  // --- Haptic Feedback State and Logic (Unchanged) ---
  const [isAnimating, setIsAnimating] = useState(false);
  const wasEnabledRef = useRef(false);

  useEffect(() => {
    if (!wasEnabledRef.current && isNextEnabled) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 800);

      return () => clearTimeout(timer);
    }

    wasEnabledRef.current = isNextEnabled;
  }, [isNextEnabled]);

  // --- Progress calculation ---
  // Start at 30% by default so the UI shows initial progress rather than 0%.
  let progressPercentage = 30;

  if (isFormatSelected) {
    let currentStep = 1;
    let reviewStepIndex = 5; // Default for One-Time (Review is step 5 after moving References earlier)

    if (isRecurrent) {
      currentStep = recurrentStep;
      reviewStepIndex = 6;
    } else if (isSeries) {
      currentStep = seriesStep;
      reviewStepIndex = 6;
    } else if (isCatalogue) {
      currentStep = catalogueStep;
      reviewStepIndex = 6;
    } else {
      // One-Time
      currentStep = oneTimeStep;
      reviewStepIndex = 5;
    }

    if (currentStep >= reviewStepIndex) {
      progressPercentage = 100;
    } else {
      const start = 30;
      const range = 70;
      const fraction = (currentStep - 1) / (reviewStepIndex - 1);
      progressPercentage = start + fraction * range;
    }
  }
  // Estimate remaining time (in seconds) based on progress percentage (0-100).
  const remainingSeconds = Math.max(
    0,
    Math.round((1 - progressPercentage / 100) * 60)
  );

  // --- Active Button State Colors (Navy primary for premium brand) ---
  const ACTIVE_BG_COLOR = "var(--color-primary)";
  const ACTIVE_SHADOW = "0 2px 6px rgba(6, 24, 58, 0.18)";
  // -------------------------------------------------------------------

  const handleNext = () => {
    if (!isNextEnabled) {
      console.error("Cannot proceed: Please complete the required fields.");
      return;
    }

    if (isSeries) {
      if (seriesStep === 1) setSeriesStep(2);
      else if (seriesStep === 2) setSeriesStep(3); // To Length
      else if (seriesStep === 3) setSeriesStep(4); // To Tone
      else if (seriesStep === 4) setSeriesStep(5); // To Privacy
      else if (seriesStep === 5) setSeriesStep(6); // To Review
      else if (seriesStep === 6) {
        // Open payment modal before final success
        setPendingSubmission({ flow: "series", nextStep: 7 });
        setPaymentAmount(Math.max(15, displayPrice || 35));
        setPaymentModalOpen(true);
      }
    } else if (isRecurrent) {
      if (recurrentStep === 1) setRecurrentStep(2);
      else if (recurrentStep === 2) setRecurrentStep(3); // To Length
      else if (recurrentStep === 3) setRecurrentStep(4); // To Tone
      else if (recurrentStep === 4) setRecurrentStep(5); // To Privacy
      else if (recurrentStep === 5) setRecurrentStep(6); // To Review
      else if (recurrentStep === 6) {
        setPendingSubmission({ flow: "recurrent", nextStep: 7 });
        setPaymentAmount(Math.max(15, displayPrice || 35));
        setPaymentModalOpen(true);
      }
    } else if (isCatalogue) {
      if (catalogueStep === 1) setCatalogueStep(2);
      else if (catalogueStep === 2) setCatalogueStep(3); // To Length
      else if (catalogueStep === 3) setCatalogueStep(4); // To Tone
      else if (catalogueStep === 4) setCatalogueStep(5); // To Privacy
      else if (catalogueStep === 5) setCatalogueStep(6); // To Review
      else if (catalogueStep === 6) {
        setPendingSubmission({ flow: "catalogue", nextStep: 7 });
        setPaymentAmount(Math.max(15, displayPrice || 50));
        setPaymentModalOpen(true);
      }
    } else {
      // One-Time
      if (oneTimeStep === 1) setOneTimeStep(2); // To Length
      else if (oneTimeStep === 2) setOneTimeStep(3); // To Tone
      else if (oneTimeStep === 3) setOneTimeStep(4); // To Privacy
      else if (oneTimeStep === 4) setOneTimeStep(5); // To Review
      else if (oneTimeStep === 5) {
        setPendingSubmission({ flow: "one-time", nextStep: 6 });
        setPaymentAmount(Math.max(15, displayPrice || 25));
        setPaymentModalOpen(true);
      }
    }
  };

  const handleBack = () => {
    if (isSeries) {
      if (seriesStep === 1) {/* keep selectedDeliveryType to preserve inputs */ }
      else if (seriesStep === 2) setSeriesStep(1);
      else if (seriesStep === 3) setSeriesStep(2);
      else if (seriesStep === 4) setSeriesStep(3);
      else if (seriesStep === 5) setSeriesStep(4);
      else if (seriesStep === 6) setSeriesStep(5);
    } else if (isRecurrent) {
      if (recurrentStep === 1) {/* keep selectedDeliveryType to preserve inputs */ }
      else if (recurrentStep === 2) setRecurrentStep(1);
      else if (recurrentStep === 3) setRecurrentStep(2);
      else if (recurrentStep === 4) setRecurrentStep(3);
      else if (recurrentStep === 5) setRecurrentStep(4);
      else if (recurrentStep === 6) setRecurrentStep(5);
    } else if (isCatalogue) {
      if (catalogueStep === 1) {/* keep selectedDeliveryType to preserve inputs */ }
      else if (catalogueStep === 2) setCatalogueStep(1);
      else if (catalogueStep === 3) setCatalogueStep(2);
      else if (catalogueStep === 4) setCatalogueStep(3);
      else if (catalogueStep === 5) setCatalogueStep(4);
      else if (catalogueStep === 6) setCatalogueStep(5);
    } else if (selectedDeliveryType === "one-time") {
      if (oneTimeStep === 1) {/* keep selectedDeliveryType to preserve inputs */ }
      else if (oneTimeStep === 2) setOneTimeStep(1);
      else if (oneTimeStep === 3) setOneTimeStep(2);
      else if (oneTimeStep === 4) setOneTimeStep(3);
      else if (oneTimeStep === 5) setOneTimeStep(4);
    }
  };

  const handleSelectDelivery = (type) => {
    if (isTransitioning) return;

    // Clear any previous format message immediately and set selection
    setFormatSelectedMessage(null);
    setSelectedDeliveryType(type);
    setIsTransitioning(true);

    setTimeout(() => {
      // Preserve user's title/description and tone/style selections.
      // Keep some flow-specific defaults but advance each flow to the
      // step after Tone & Style (the Video Length step) so we don't
      // duplicate the Tone & Style UI which already appears on page 1.
      setSelectedFrequency(null);
      setCustomRecurrentDates([]); // Reset recurrent dates

      // RESET SERIES STATE but advance to configuration step (2)
      setSeriesStep(2);
      setNumberOfEpisodes(5);
      setSelectedReleaseSchedule(null);
      setCustomSeriesDates([]);

      // CATALOGUE: advance to configuration step (2)
      setCatalogueStep(2);
      setTargetVideos(10);
      setThemes("");

      // Do not clear tone/style or title/description — keep user input.
      setSelectedVideoLength(null);
      setCustomVideoLength("");
      setUploadedFiles([]);
      setReferenceLinks([]);
      setSelectedPrivacy(null);

      // Advance the flow-specific step so the next CTA goes to Length.
      // For one-time requests, we now start at step 2 (Video Length).
      if (type === "one-time") setOneTimeStep(2);
      if (type === "recurrent") setRecurrentStep(1);
      if (type === "series") setSeriesStep(2);
      if (type === "catalogue") setCatalogueStep(2);

      // Immediately show a short confirmation message so users see feedback
      const immediateMap = {
        series: "Series selected — now configure episode details.",
        catalogue: "Catalogue selected — set target videos and themes.",
        recurrent: "Recurrent selected — choose a delivery frequency.",
        "one-time": "One-Time selected — next step: Video Length.",
      };
      try {
        setFormatSelectedMessage(immediateMap[type] || null);
      } catch (e) { }

      setIsTransitioning(false);
    }, 1000);
  };

  // Payment Integration (Stripe / Backend)
  // When user clicks Pay, we call backend to create a checkout session or intent
  const handlePayment = async () => {
    console.log('🟢🟢🟢 HANDLE PAYMENT CALLED');
    console.log('🟢 Title:', title);
    console.log('🟢 Description:', description);
    console.log('🟢 Amount:', paymentAmount);
    
    // 0. Validate minimum amount based on creator price
    const creatorMinimum = (selectedCreator && selectedCreator.price && Number(selectedCreator.price) > 0) ? Number(selectedCreator.price) : 15;
    if (paymentAmount < creatorMinimum) {
        showToast(`Minimum amount for this creator is $${creatorMinimum}. Please increase the amount.`);
        return;
    }
    
    // 1. Validate auth - removed to allow anonymous requests
    // if (!auth.user) {
    //   auth.openAuthModal();
    //   return;
    // }

    // 2. Prepare payload
    const requestData = {
        title,
        description,
        deliveryType: selectedDeliveryType,
        privacy: selectedPrivacy,
        videoLength: selectedVideoLength === 'custom' ? customVideoLength : selectedVideoLength,
        tones: selectedTones,
        // ... include other fields based on flow
        ...(selectedDeliveryType === 'series' ? { episodes: numberOfEpisodes, schedule: selectedReleaseSchedule, customDates: customSeriesDates } : {}),
        ...(selectedDeliveryType === 'recurrent' ? { frequency: selectedFrequency, customDates: customRecurrentDates } : {}),
        ...(selectedDeliveryType === 'catalogue' ? { targetVideos, themes } : {}),
        selectedCreator: selectedCreator ? selectedCreator.id : null,
        // Added for restoration after redirect
        flow: pendingSubmission ? pendingSubmission.flow : 'one-time',
        nextStep: pendingSubmission ? pendingSubmission.nextStep : 1,
        amount: paymentAmount,
        currency: 'usd',
        role: paymentRole
    };

    // 3. Save Request to Frontend & Backend BEFORE Redirecting
    let createdRequest = null;
    let isBackendSynced = false;
    try {
        // Frontend Save: Optimistic
        const REQUESTS_KEY = "ideas_requests_v1";
        const tempId = `req_${Date.now()}`;
        
        // CRITICAL FIX #1: Always create valid creator object (never null)
        let submitterCreator = null;
        if (auth && auth.user) {
            submitterCreator = { id: auth.user.id, name: auth.user.name };
            // Include profile image for request card display
            try {
                const u = JSON.parse(localStorage.getItem('regaarder_user') || '{}');
                if (u.image && !String(u.image).startsWith('blob:') && !String(u.image).startsWith('data:')) {
                    submitterCreator.image = u.image;
                }
            } catch (e) { }
        } else {
            submitterCreator = { id: 'anonymous', name: 'Anonymous User' };
        }
        
        const newRequest = {
            id: tempId,
            title: requestData.title || "",
            description: requestData.description || "",
            delivery: requestData.flow,
            step: requestData.nextStep,
            amount: requestData.amount,
            funding: requestData.amount, // Add funding for display
            role: requestData.role,
            creator: submitterCreator,
            createdBy: submitterCreator.id, // Add createdBy for filtering/display
            createdAt: new Date().toISOString(),
            meta: {
              selectedTones: requestData.tones || [],
              selectedVideoLength: requestData.videoLength || null,
              selectedPrivacy: requestData.privacy || null,
            },
            isPendingPayment: true // Flag to indicate it's not fully paid yet
        };

        const raw = window.localStorage.getItem(REQUESTS_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        if (!arr.some(r => r.id === newRequest.id)) {
          arr.unshift(newRequest);
          window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(arr));
        }

        // Backend Save: Create Record
        const token = localStorage.getItem('regaarder_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const payload = {
              id: tempId,
              title: newRequest.title,
              description: newRequest.description,
              creator: newRequest.creator,
              createdBy: newRequest.createdBy,
              meta: newRequest.meta,
              amount: newRequest.amount,
              funding: newRequest.funding
        };
        console.log('Sending request to backend:', payload);

        // Use public endpoint if user is anonymous (no token) so requests still persist
        const endpoint = token ? `${BACKEND}/requests` : `${BACKEND}/requests/public`;

        const saveRes = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        console.log('🟢🟢🟢 Backend save response:', saveRes.status, saveRes.statusText);
        
        if (saveRes.ok) {
            const json = await saveRes.json();
            console.log('🟢🟢🟢 Backend returned:', json);
            createdRequest = json.request || newRequest;
            isBackendSynced = true;

            // FORCE UPDATE LOCAL STORAGE with the confirmed backend data
            try {
                const rawUpd = window.localStorage.getItem(REQUESTS_KEY);
                const arrUpd = rawUpd ? JSON.parse(rawUpd) : [];
                // Update the existing optimistic entry or add if missing
                const idx = arrUpd.findIndex(r => r.id === newRequest.id);
                const merged = { ...newRequest, ...createdRequest, backendSynced: true };
                if (idx !== -1) {
                    arrUpd[idx] = merged;
                } else {
                    arrUpd.unshift(merged);
                }
                window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(arrUpd));
                console.log('Local storage updated with backend synced request:', merged.id);
            } catch(e) { console.error('LS update failed', e); }

        } else {
             createdRequest = newRequest; // Fallback to optimistic ID
             isBackendSynced = false;
        }

    } catch (e) { console.error("Failed to save request before payment", e); }

    // 4. Skip Stripe payment - directly save to backend and show success
    // The request was already saved in step 3, so just show success and redirect
    
    const requestDataWithId = {
        ...requestData,
        id: createdRequest ? createdRequest.id : null,
        backendSynced: isBackendSynced,
        flow: pendingSubmission ? pendingSubmission.flow : 'one-time',
        nextStep: pendingSubmission ? pendingSubmission.nextStep : 'step-3-success'
    };

    try {
        localStorage.setItem('pending_payment_data', JSON.stringify(requestDataWithId));
    } catch(e) { }

    // If request was already saved to backend, show success
    if (isBackendSynced) {
        console.log('🟢🟢🟢 Request already synced to backend, showing success');
        showToast(`Request submitted with $${paymentAmount} funding!`);
        
        // Reset form
        setTitle('');
        setDescription('');
        setPendingSubmission(null);
        setPaymentModalOpen(false);
        
        // Navigate to requests page
        setTimeout(() => {
          window.location.href = '/requests?filter=For You';
        }, 1000);
        return;
    }

    // If not synced yet, call continuePendingSubmission to save
    console.log('🟢🟢🟢 Request not synced yet, calling continuePendingSubmission');
    continuePendingSubmission(paymentAmount, requestDataWithId);
    
    showToast(`Request submitted with $${paymentAmount} funding!`);
    
    // Reset form
    setTitle('');
    setDescription('');
    setPendingSubmission(null);
    setPaymentModalOpen(false);
    
    // Navigate to requests page
    setTimeout(() => {
      window.location.href = '/requests?filter=For You';
    }, 1000);
  };

  // FREE SUBMISSION - Submit request without payment
  const handleFreeSubmission = async () => {
    console.log('🟢🟢🟢 FREE SUBMISSION CALLED');
    console.log('🟢 Title:', title);
    console.log('🟢 Description:', description);
    
    if (!title || !title.trim()) {
      showToast('Please enter a title for your request');
      return;
    }

    try {
      const REQUESTS_KEY = "ideas_requests_v1";
      const tempId = `req_${Date.now()}`;
      const BACKEND = (window && window.__BACKEND_URL__) || 'https://regaarder-pwin.onrender.com';
      
      // Create valid creator object - use localStorage instead of auth context
      let submitterCreator = null;
      try {
        const rawUser = localStorage.getItem('regaarder_user');
        if (rawUser) {
          const user = JSON.parse(rawUser);
          if (user && user.id) {
            submitterCreator = { id: user.id, name: user.name || user.displayName || 'User' };
            // Include profile image for request card display
            if (user.image && !String(user.image).startsWith('blob:') && !String(user.image).startsWith('data:')) {
              submitterCreator.image = user.image;
            }
          }
        }
      } catch (e) { }
      
      if (!submitterCreator) {
        submitterCreator = { id: 'anonymous', name: 'Anonymous User' };
      }
      
      const newRequest = {
        id: tempId,
        title: title.trim(),
        description: description || '',
        delivery: pendingSubmission ? pendingSubmission.flow : 'one-time',
        amount: 0,
        funding: 0,
        creator: submitterCreator,
        createdBy: submitterCreator.id,
        createdAt: new Date().toISOString(),
        meta: {
          selectedTones: selectedTones || [],
          selectedVideoLength: selectedVideoLength || null,
          selectedPrivacy: selectedPrivacy || null,
        },
        isFreeSubmission: true
      };

      // Save to localStorage first (optimistic)
      const raw = window.localStorage.getItem(REQUESTS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(newRequest);
      window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(arr));
      console.log('🟢 Saved to localStorage:', newRequest.id);

      // Save to backend
      const token = localStorage.getItem('regaarder_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        id: tempId,
        title: newRequest.title,
        description: newRequest.description,
        creator: newRequest.creator,
        createdBy: newRequest.createdBy,
        meta: newRequest.meta,
        amount: 0,
        funding: 0
      };
      
      const endpoint = token ? `${BACKEND}/requests` : `${BACKEND}/requests/public`;
      console.log('🟢 Sending to backend:', endpoint, payload);

      const saveRes = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      console.log('🟢🟢🟢 Backend response:', saveRes.status, saveRes.statusText);

      if (saveRes.ok) {
        const json = await saveRes.json();
        console.log('🟢🟢🟢 Backend returned:', json);
        
        // Update localStorage with confirmed data
        const rawUpd = window.localStorage.getItem(REQUESTS_KEY);
        const arrUpd = rawUpd ? JSON.parse(rawUpd) : [];
        const idx = arrUpd.findIndex(r => r.id === tempId);
        if (idx !== -1) {
          arrUpd[idx] = { ...arrUpd[idx], ...json.request, backendSynced: true };
          window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(arrUpd));
        }
        
        showToast('Request submitted successfully!');
        
        // Reset form
        setTitle('');
        setDescription('');
        setPendingSubmission(null);
        setPaymentModalOpen(false);
        
        // Store request data and show free request submitted modal
        // The modal handlers will navigate to requests page when user interacts with them
        setCurrentFreeRequest({ ...newRequest, id: json.request?.id || newRequest.id });
        setShowFreeRequestSubmittedModal(true);

        // Update footer tab (do NOT navigate yet - let modal handle it)
        try {
          if (window.setFooterTab) window.setFooterTab('requests');
        } catch (e) { }
        // Navigation is now handled by the modal's onClose, onBoostRequest, or onInviteContributors callbacks
      } else {
        console.error('🔴 Backend save failed:', saveRes.status);
        showToast('Failed to save request. Please try again.');
      }
    } catch (err) {
      console.error('🔴 Free submission error:', err);
      showToast('Failed to submit request. Please try again.');
    }
  };

  const continuePendingSubmission = async (amount, overrideData = null) => {
    // If restoring from redirect, pendingSubmission might be null, so check overrideData too
    const sourceData = overrideData || {};
    const effectivePendingSubmission = pendingSubmission || (sourceData.flow ? { flow: sourceData.flow, nextStep: sourceData.nextStep } : null);

    if (!effectivePendingSubmission) return;
    console.log('continuePendingSubmission start', { amount, effectivePendingSubmission, sourceData });
    const finalAmount = typeof amount === "number" ? amount : (sourceData.amount || paymentAmount);
    // Persist chosen payment as customPrice so previews reflect the paid amount
    setCustomPrice(finalAmount);

    const { flow, nextStep } = effectivePendingSubmission;
    // Skip success step to allow fresh start immediately
    // if (flow === "one-time") setOneTimeStep(nextStep);
    // else if (flow === "series") setSeriesStep(nextStep);
    // else if (flow === "recurrent") setRecurrentStep(nextStep);
    // else if (flow === "catalogue") setCatalogueStep(nextStep);

    // Create a lightweight request object and publish it so other parts
    // of the app (for example `requests.jsx`) can pick it up immediately.
    try {
      const REQUESTS_KEY = "ideas_requests_v1";
      // Reuse ID if already synced, else generate new
      const finalId = sourceData.id || `req_${Date.now()}`;
      
      // Robustly get the user from localStorage (not auth context which may not exist)
      let currentUser = null;
      try {
          const rawUser = localStorage.getItem('regaarder_user');
          if (rawUser) currentUser = JSON.parse(rawUser);
      } catch (e) { }

      // CRITICAL FIX: Always create valid creator object - never null
      const creatorObj = currentUser 
          ? { id: currentUser.id, name: currentUser.name, image: currentUser.image || currentUser.avatar || '' }
          : { id: 'anonymous', name: 'Anonymous User', image: '' };
      
      const newRequest = {
        id: finalId,
        title: sourceData.title || title || "",
        description: sourceData.description || description || "",
        delivery: flow,
        step: nextStep,
        amount: finalAmount,
        funding: finalAmount, // Add funding for display in requests feed
        role: sourceData.role || paymentRole,
        // The request author should be the logged-in user (the requester), not the selected creator.
        creator: creatorObj,
        createdBy: creatorObj.id, // Use creator id consistently
        createdAt: new Date().toISOString(),
        meta: {
          selectedTones: sourceData.tones || selectedTones || [],
          selectedVideoLength: sourceData.videoLength || selectedVideoLength || null,
          selectedPrivacy: sourceData.privacy || selectedPrivacy || null,
        },
      };

      // Optimistically save to local storage immediately so it appears on the Requests page 
      // even if the user navigates before the backend responds.
      try {
        const raw = window.localStorage.getItem(REQUESTS_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        // Check duplication by ID
        if (!arr.some(r => r.id === newRequest.id)) {
          arr.unshift(newRequest);
          window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(arr));
        }
      } catch (e) { /* ignore storage errors */ }

      // Persist to backend so the Requests feed shows it for all users.
      // IF already synced in handlePayment, DO NOT create again.
      console.log('Checking backend sync status:', sourceData.backendSynced);
      if (!sourceData.backendSynced) {
        try {
          const token = localStorage.getItem('regaarder_token');
          const headers = { 'Content-Type': 'application/json' };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          console.log('Attempting backup save to backend in continuePendingSubmission', newRequest.id);
          
          // Use public endpoint if no token found
          const endpoint = token ? `${BACKEND}/requests` : `${BACKEND}/requests/public`;
          
          const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              id: newRequest.id, // Share ID with backend for consistency
              title: newRequest.title,
              description: newRequest.description,
              creator: newRequest.creator,
              createdBy: newRequest.createdBy,
              meta: newRequest.meta,
              amount: newRequest.amount,
              funding: newRequest.funding
            })
          });
          
          if (res.ok) {
            const data = await res.json();
            console.log('Backup save result:', res.status, data);
            // If backend saved and returned the created request, use that object
            const published = (data && data.request) ? data.request : newRequest;

            // Update the stored request with the authoritative version from backend
            try {
                const raw = window.localStorage.getItem(REQUESTS_KEY);
                let arr = raw ? JSON.parse(raw) : [];
                // Replace the optimistic entry with the server response
                const idx = arr.findIndex(r => r.id === newRequest.id);
                const complete = { ...newRequest, ...published, backendSynced: true };
                if (idx !== -1) arr[idx] = complete; else arr.unshift(complete);
                window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(arr));
            } catch(e) {}
          }
        } catch(e) { console.error('Backup save failed', e); }
      } else {
         // Even if backendSynced is true, ensure local storage has the flag
         try {
            const rawUpd = window.localStorage.getItem(REQUESTS_KEY);
            if (rawUpd) {
                const arrUpd = JSON.parse(rawUpd);
                const idx = arrUpd.findIndex(r => r.id === newRequest.id);
                if (idx !== -1 && !arrUpd[idx].backendSynced) {
                     arrUpd[idx].backendSynced = true;
                     window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(arrUpd));
                }
            }
         } catch(e) {}
      }

      // Broadcast a short-lived event so other windows/components can react immediately
      try {
        const ev = new CustomEvent("ideas:request_created", {
          detail: newRequest,
        });
        window.dispatchEvent(ev);
      } catch (e) {
        /* ignore */
      }
    } catch (e) {
      // ignore publishing errors
    }

    // Clear inputs for a fresh start
    setTitle("");
    setDescription("");
    setUploadedFiles([]);
    setReferenceLinks([]);
    setThemes("");
    setCustomRecurrentDates([]);
    setCustomSeriesDates([]);
    setCustomPrice(null);
    try { localStorage.removeItem("ideas_draft_v1"); } catch (e) { }

    // Reset flow to initial state
    setSelectedDeliveryType(null);
    setOneTimeStep(1);
    setSeriesStep(1);
    setRecurrentStep(1);
    setCatalogueStep(1);
    setShowExamples(false);
    try { localStorage.setItem('ideas_examples_seen_v1', '1'); } catch (e) { }
    showToast("Request submitted successfully!");

    // Clear pending and close modal
    setPendingSubmission(null);
    setPaymentModalOpen(false);

    // Redirect to requests page immediately so user sees the new item
    try {
      navigate('/requests?filter=For You');
    } catch (e) {
      window.location.href = '/requests?filter=For You';
    }
  };

  // Persist edits made inside the ReviewRequestStep back to global state
  const handleSaveReview = (vals) => {
    if (!vals || typeof vals !== 'object') return;
    try {
      if (vals.title !== undefined) setTitle(vals.title);
      if (vals.description !== undefined) setDescription(vals.description);
      if (vals.privacy !== undefined) setSelectedPrivacy(vals.privacy);
      if (vals.price !== undefined) setCustomPrice(Number(vals.price) || 0);
      if (vals.delivery !== undefined) setSelectedDeliveryType(vals.delivery);
      if (vals.length !== undefined) setSelectedVideoLength(vals.length);
      if (vals.customLength !== undefined) setCustomVideoLength(vals.customLength);
      if (vals.frequency !== undefined) setSelectedFrequency(vals.frequency);
      if (vals.tones !== undefined) setSelectedTones(vals.tones || []);
      if (vals.themes !== undefined) setThemes(vals.themes || "");
      if (vals.targetVideos !== undefined) setTargetVideos(vals.targetVideos);
      if (vals.files !== undefined) setUploadedFiles(vals.files || []);
      if (vals.links !== undefined) setReferenceLinks(vals.links || []);
    } catch (e) {
      // ignore individual setter errors
    }
  };

  // --- Title Animation Logic (Unchanged)
  useEffect(() => {
    let isMounted = true;
    let sweepStartTimeout, hideTitleTimeout, nextTitleChange;

    const cycle = () => {
      if (!isMounted) return;

      setTitleVisible(true);

      sweepStartTimeout = setTimeout(() => {
        setSweepActive(true);
      }, SWEEP_START_DELAY);

      hideTitleTimeout = setTimeout(() => {
        setSweepActive(false);
        setTitleVisible(false);
      }, SWEEP_START_DELAY + SWEEP_DURATION);

      nextTitleChange = setTimeout(() => {
        setCurrentTitleIndex((prevIndex) => (prevIndex + 1) % titles.length);
        cycle();
      }, SWEEP_START_DELAY + SWEEP_DURATION + FADE_DURATION);

      return () => {
        clearTimeout(sweepStartTimeout);
        clearTimeout(hideTitleTimeout);
        clearTimeout(nextTitleChange);
      };
    };

    cycle();

    return () => {
      isMounted = false;
    };
  }, [titles.length]);

  // --- Autosave / Restore Draft ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ideas_draft_v1");
      if (saved) {
        const obj = JSON.parse(saved);
        if (obj.description) setDescription(obj.description);
        if (obj.title) setTitle(obj.title);
        // Intentionally do NOT auto-restore `selectedDeliveryType` to avoid
        // pre-selecting a format. The user should explicitly choose a format.
      }
    } catch (e) {
      // ignore
    }
    setIsDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!isDraftLoaded) return;
    try {
      const payload = {
        description,
        title,
        selectedDeliveryType,
        selectedTones,
        selectedVideoLength,
        selectedPrivacy,
      };
      localStorage.setItem("ideas_draft_v1", JSON.stringify(payload));
    } catch (e) {
      // ignore
    }
  }, [
    description,
    title,
    selectedDeliveryType,
    selectedTones,
    selectedVideoLength,
    selectedPrivacy,
    isDraftLoaded,
  ]);

  // Determine the current step status for the card
  let currentStatusText = isFormatSelected ? "1/1" : "0/1";

  if (isRecurrent) {
    currentStatusText = recurrentStep === 6 ? "6/6" : `${recurrentStep}/6`;
  } else if (isSeries) {
    currentStatusText = seriesStep === 6 ? "6/6" : `${seriesStep}/6`;
  } else if (isCatalogue) {
    currentStatusText = catalogueStep === 6 ? "6/6" : `${catalogueStep}/6`;
  } else if (selectedDeliveryType === "one-time") {
    currentStatusText = oneTimeStep === 5 ? "5/5" : `${oneTimeStep}/5`;
  }

  // Check if we are on the Tone Step, Length Step, or References Step to render special footer
  const isPremiumStep =
    (selectedDeliveryType === "one-time" &&
      (oneTimeStep === 2 || oneTimeStep === 3)) ||
    (isRecurrent &&
      (recurrentStep === 3 || recurrentStep === 4)) ||
    (isSeries && (seriesStep === 3 || seriesStep === 4)) ||
    (isCatalogue &&
      (catalogueStep === 3 || catalogueStep === 4));

  const isSuccessStep =
    (isSeries && seriesStep === 7) ||
    (isRecurrent && recurrentStep === 7) ||
    (isCatalogue && catalogueStep === 7) ||
    (selectedDeliveryType === "one-time" && oneTimeStep === 6);

  const getNextLabel = () => {
    if (isSeries) {
      if (seriesStep === 1) return getTranslation("Continue to Number of Episodes", selectedLanguage);
      if (seriesStep === 2) return getTranslation("Continue to Video Length", selectedLanguage);
      if (seriesStep === 3) return getTranslation("Continue to Tone & Style", selectedLanguage);
      if (seriesStep === 4) return getTranslation("Continue to Privacy", selectedLanguage);
      if (seriesStep === 5) return getTranslation("Review Request", selectedLanguage);
      if (seriesStep === 6) return getTranslation("Submit Request", selectedLanguage);
    }

    if (isCatalogue) {
      if (catalogueStep === 1) return getTranslation("Continue to Configuration", selectedLanguage);
      if (catalogueStep === 2) return getTranslation("Continue to Video Length", selectedLanguage);
      if (catalogueStep === 3) return getTranslation("Continue to Tone & Style", selectedLanguage);
      if (catalogueStep === 4) return getTranslation("Continue to Privacy", selectedLanguage);
      if (catalogueStep === 5) return getTranslation("Review Request", selectedLanguage);
      if (catalogueStep === 6) return getTranslation("Submit Request", selectedLanguage);
    }

    if (isRecurrent) {
      if (recurrentStep === 1) return getTranslation("Continue to Video Length", selectedLanguage);
      if (recurrentStep === 2) return getTranslation("Continue to Video Length", selectedLanguage);
      if (recurrentStep === 3) return getTranslation("Continue to Tone & Style", selectedLanguage);
      if (recurrentStep === 4) return getTranslation("Continue to Privacy", selectedLanguage);
      if (recurrentStep === 5) return getTranslation("Review Request", selectedLanguage);
      if (recurrentStep === 6) return getTranslation("Submit Request", selectedLanguage);
    }

    if (selectedDeliveryType === "one-time") {
      if (oneTimeStep === 1) return getTranslation("Continue to Video Length", selectedLanguage);
      if (oneTimeStep === 2) return getTranslation("Continue to Tone & Style", selectedLanguage);
      if (oneTimeStep === 3) return getTranslation("Continue to Privacy", selectedLanguage);
      if (oneTimeStep === 4) return getTranslation("Review Request", selectedLanguage);
      if (oneTimeStep === 5) return getTranslation("Submit Request", selectedLanguage);
    }

    if (!isFormatSelected) return getTranslation('Next', selectedLanguage);
    return getTranslation('Next', selectedLanguage);
  };

  return (
    <div className="min-h-screen flex flex-col app-container" style={{ backgroundColor: '#F8F8FA' }}>
      {/* Animations and helpers are defined in source; theme variables are global via ThemeProvider */}

      {/* Header: Progress Text and Visual Bar */}
      <header
        className="px-5 pt-4 sticky top-0 z-20"
        style={{ backgroundColor: '#F8F8FA', borderBottom: '1px solid rgba(15,23,42,0.03)', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))', marginBottom: '4px' }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-700 font-medium">{getTranslation('Progress', selectedLanguage)}</span>
          <span className="text-sm font-normal" style={{ color: 'var(--color-accent)' }}>
            {progressPercentage.toFixed(0)}% {getTranslation('complete', selectedLanguage)}
          </span>
        </div>
        {/* Visual Progress Bar */}
        <div
          className="h-2 bg-gray-200 rounded-full overflow-hidden w-full mb-6"
          style={{ marginTop: "10px" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercentage}%`,
              background:
                "linear-gradient(90deg, rgba(var(--color-gold-rgb),0.18), rgba(var(--color-gold-rgb),0.06))",
              boxShadow: "0 0 3px rgba(var(--color-gold-rgb),0.12)",
            }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">{getTranslation('Don\'t lose your progress — 30% complete', selectedLanguage).replace('30%', `${progressPercentage.toFixed(0)}%`)}</div>
      </header>

      <main className="ideas-root flex-grow px-5 pb-0 max-w-lg mx-auto w-full">
        {/* Main Heading Container (Animated Text) */}
        <div
          ref={titleBoxRef}
          className="mt-8 mb-5 rounded-xl text-center cream-glow-box"
          style={{
            padding: "18px 28px",
            background: `radial-gradient(ellipse at center, rgba(var(--color-gold-rgb,203,138,0),0.20) 0%, rgba(var(--color-gold-rgb,203,138,0),0.12) 18%, rgba(var(--color-gold-rgb,203,138,0),0.07) 36%, rgba(var(--color-gold-rgb,203,138,0),0.03) 60%, #F8F8FA 100%), linear-gradient(180deg, rgba(248,248,250,0.66), rgba(248,248,250,0.9))`,
            border: "1px solid rgba(var(--color-gold-rgb,203,138,0),0.12)",
            boxShadow: "inset 0 10px 30px rgba(255,255,255,0.6), inset 0 -8px 20px rgba(var(--color-gold-rgb,203,138,0),0.03), 0 6px 18px rgba(2,6,23,0.02)",
            WebkitBackdropFilter: "blur(4px)",
            backdropFilter: "blur(4px)"
          }}
        >
          <h1
            className={`
                            text-xl sm:text-2xl md:text-[26px] font-normal tracking-tighter leading-normal mx-auto max-w-fit 
                            sweeping-text-container 
                            transition-all ease-out
                            ${titleVisible
                ? "opacity-100 translate-y-0 duration-[500ms]"
                : "opacity-0 translate-y-1 duration-[500ms]"
              }
                        `}
            style={{
              color: `rgb(var(--color-gold-rgb,203,138,0))`,
              fontWeight: 300,
              fontSize: 'clamp(18px, 5vw, 30px)',
              letterSpacing: '0',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              display: 'block',
              margin: '0 auto',
              textAlign: 'center'
            }}
          >
            {titles[currentTitleIndex]}
            {sweepActive && (
              <span className="sweep-effect" key={currentTitleIndex} />
            )}
          </h1>
        </div>

        {/* --- START: Time Estimate (hidden when request is complete) --- */}
        {!isSuccessStep && progressPercentage < 95 && (
          <div className="flex items-center justify-center mt-4 mb-8">
            <div
              className="inline-flex items-center rounded-xl px-4 py-2"
              style={{
                background: '#F6F6F8',
                border: '1px solid rgba(15,23,42,0.015)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                color: '#6B7280',
                width: titleBoxWidth ? `${titleBoxWidth}px` : 'auto',
                justifyContent: 'center',
                borderRadius: '12px',
                paddingLeft: '1.25rem',
                paddingRight: '1.25rem'
              }}
            >
              <Clock className="w-5 h-5 mr-3 text-gray-500" />
              <span className="text-base font-normal text-gray-600">
                {remainingSeconds >= 60
                  ? getTranslation('About 1 minute left', selectedLanguage)
                  : `${getTranslation('About', selectedLanguage)} ${remainingSeconds} ${remainingSeconds === 1 ? getTranslation('second', selectedLanguage) : getTranslation('seconds', selectedLanguage)} ${getTranslation('left', selectedLanguage)}`}
              </span>
            </div>
          </div>
        )}
        {/* --- END: Time Estimate --- */}

        {/* --- START: Selection Status Card --- */}
        <div
          className="bg-gray-50 p-4 mb-8 border border-gray-200 rounded-xl flex justify-between items-center transition duration-200"
          style={{
            boxShadow:
              "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300`}
            style={{
              borderColor: isFormatSelected
                ? "rgba(var(--color-gold-rgb, 203,138,0), 0.20)"
                : "rgb(156 163 175)",
              backgroundColor: isFormatSelected
                ? "rgba(var(--color-gold-rgb, 203,138,0), 0.10)"
                : "transparent",
            }}
          >
            {isFormatSelected && (
              <Check className="w-4 h-4 text-[var(--color-gold)]" strokeWidth={3} />
            )}
          </div>
          <span
            className="text-sm font-medium ml-auto"
            style={{
              color: isFormatSelected
                ? "var(--color-gold-light)"
                : "rgb(156 163 175)",
            }}
          >
            {currentStatusText}
          </span>
        </div>
        {/* --- END: Selection Status Card --- */}

        {/* --- DESCRIPTION & TITLE (now collected before format selection) --- */}
        <div className="space-y-4 mb-6">
          <label htmlFor="description-input" className="sr-only">
            Description <span className="sr-only">*</span>
          </label>
          {/* Selected creator banner: appears automatically when arriving with a pre-selected creator */}
          {selectedCreator && !showCreatorModal && (
            <div className="mb-3" style={{ zIndex: 10, position: "relative" }}>
              {console.log('[ideas-display] selectedCreator:', selectedCreator, 'selectedCreatorImage:', selectedCreatorImage, 'creatorsList.length:', creatorsList.length)}
              <div
                className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center justify-between gap-3"
                style={{ position: "relative", zIndex: 10 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center rounded-full font-semibold text-sm overflow-hidden">
                    {selectedCreatorImage ? (
                      <img src={selectedCreatorImage} alt={selectedCreator.name || selectedCreator.handle} className="w-full h-full object-cover" />
                    ) : (
                      (() => {
                        // Check creatorsList for an image (the useEffect will update state, but render the image immediately if found)
                        const creatorFromList = creatorsList.length > 0 ? creatorsList.find(c => c.id === selectedCreator.id) : null;
                        const listImg = creatorFromList ? (creatorFromList.photoURL || creatorFromList.image) : null;
                        if (listImg) {
                          return <img src={listImg} alt={selectedCreator.name} className="w-full h-full object-cover" />;
                        }
                        
                        const seed = String(selectedCreator.id || selectedCreator.name || selectedCreator.handle || "");
                        // Preferred palette: blue, red, brown, yellow (choose hue closest to site's accent)
                        const colors = ["#60A5FA", "#EF4444", "#8B5E3C", "#FBBF24"];
                        let hash = 0;
                        for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
                        const bg = colors[Math.abs(hash) % colors.length];
                        // prefer handle/name without leading @ when deriving the letter
                        const raw = (selectedCreator.name || selectedCreator.handle || "?").toString().trim();
                        const cleaned = raw.replace(/^@+/, "");
                        const letter = (cleaned && cleaned[0]) ? cleaned[0] : "?";
                        return (
                          <div style={{ background: bg, color: "#0f172a" }} className="w-full h-full flex items-center justify-center">
                            {String(letter).toUpperCase()}
                          </div>
                        );
                      })()
                    )}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <div className="text-xs text-gray-500">{getTranslation('Requesting to', selectedLanguage)}</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedCreator.name || selectedCreator.handle}</div>
                  </div>
                </div>

                <div className="ml-4 flex items-center gap-3">
                  <button
                    onClick={() => {
                      console.log("[ideas] opening creator selection modal");
                      setShowCreatorModal(true);
                      setCreatorSearch("");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 bg-gray-50 border border-transparent hover:border-gray-200 px-3 py-1 rounded-lg"
                  >
                    {getTranslation('Change', selectedLanguage)}
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="relative z-0">
            <textarea
              id="description-input"
              ref={descriptionRef}
              rows="6"
              placeholder={getTranslation('Describe what you\'d love to see in this video.', selectedLanguage)}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_CHARS))}
              className="w-full p-5 text-gray-700 border border-gray-200 rounded-xl focus:ring-0 focus:border-gray-300 transition duration-150 resize-none outline-none text-base"
              style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)" }}
            ></textarea>
            <span className="absolute bottom-4 right-4 text-xs text-gray-400 font-medium">
              {description.length}/{MAX_CHARS} {getTranslation('char', selectedLanguage)}
            </span>
          </div>

          {description.length >= MIN_CHARS && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <label htmlFor="title-input" className="text-gray-800 font-semibold text-base block tracking-tight">
                {getTranslation('Give a title to your video', selectedLanguage)} <span className="text-red-500">*</span>
              </label>
              <input
                id="title-input"
                type="text"
                placeholder={getTranslation('Enter a title...', selectedLanguage)}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 mt-2 text-gray-700 border border-gray-200 rounded-xl focus:ring-0 focus:border-gray-300 transition duration-150 outline-none text-base"
                style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)" }}
              />
            </div>
          )}
        </div>

        {/* --- Upload References (progressive reveal after title) --- */}
        {description.length >= MIN_CHARS && title && title.length >= MIN_TITLE_CHARS && (
          <div className="mb-6">
            <ReferencesStep
              files={uploadedFiles}
              setFiles={setUploadedFiles}
              links={referenceLinks}
              setLinks={setReferenceLinks}
              selectedLanguage={selectedLanguage}
            />
          </div>
        )}

        {description.length >= MIN_CHARS && title && title.length >= MIN_TITLE_CHARS && showFormatSection && (
          <div className="relative z-40">
            <>
            {/* --- Main Question (moved above Examples box) */}
            <div className="mb-4 mt-6">
              <h2 className="text-gray-800 font-semibold text-base block tracking-tight">
                {getTranslation('Preferred delivery?', selectedLanguage)}
              </h2>
            </div>

            {/* --- Examples Box (appears after a short delay) --- */}
            {showExamples && (
              <div
                className="mb-8 rounded-xl cream-glow-box stagger-animate"
                style={{ padding: "20px", background: "radial-gradient(circle at 18% 20%, rgba(var(--color-gold-rgb,203,138,0),0.10), rgba(var(--color-gold-rgb,203,138,0),0.03) 28%, var(--color-cream-bg) 60%), var(--color-cream-bg)", border: "1px solid rgba(var(--color-gold-rgb,203,138,0),0.12)", boxShadow: "inset 0 6px 12px rgba(var(--color-gold-rgb,203,138,0),0.03)" }}
              >
                <div className="flex items-center mb-4">
                  <span className="p-1 rounded-full mr-2 text-[var(--color-gold)]" style={{ background: 'linear-gradient(135deg, rgba(var(--color-gold-rgb,203,138,0),0.12), rgba(var(--color-gold-rgb,203,138,0),0.04))', boxShadow: 'inset 0 2px 6px rgba(var(--color-gold-rgb,203,138,0),0.05)' }}>
                    <Lightbulb className="w-6 h-6 text-[var(--color-gold)]" />
                  </span>
                  <h3 className="text-base font-semibold text-gray-700">
                    {getTranslation('Examples to help you choose:', selectedLanguage)}
                  </h3>
                </div>
                {/* List of Examples */}
                <ul className="list-none space-y-3 pl-0 text-sm text-gray-700">
                  <li>
                    <strong className="text-gray-900">{getTranslation('One-Time:', selectedLanguage)}</strong>{" "}
                    {getTranslation('"Explain quantum computing," "Review the new iPhone," "My morning routine"', selectedLanguage)}
                  </li>
                  <li>
                    <strong className="text-gray-900">{getTranslation('Recurrent:', selectedLanguage)}</strong>{" "}
                    {getTranslation('"Daily market updates," "Weekly cooking tips," "Monthly tech news roundup"', selectedLanguage)}
                  </li>
                  <li>
                    <strong className="text-gray-900">{getTranslation('Series:', selectedLanguage)}</strong>{" "}
                    {getTranslation('"5-part history of Rome," "Learn Spanish in 10 episodes," "Startup journey series"', selectedLanguage)}
                  </li>
                  <li>
                    <strong className="text-gray-900">{getTranslation('Catalogue:', selectedLanguage)}</strong>{" "}
                    {getTranslation('"50 productivity hacks," "Travel guides for 20 cities," "Complete guitar tutorial library"', selectedLanguage)}
                  </li>
                </ul>
              </div>
            )}

            {/* --- START: Delivery Type Dropdown (compact with icons) --- */}
            <div className="mb-8 relative z-40">
              <div className="relative z-40">
                <button
                  type="button"
                  onClick={() => setDeliveryDropdownOpen((s) => !s)}
                  className="w-full flex items-center justify-between p-4 bg-[var(--surface)] border border-gray-200 rounded-xl shadow-sm"
                  aria-haspopup="listbox"
                  aria-expanded={deliveryDropdownOpen}
                >
                  <div className="flex items-center">
                    {selectedDeliveryType ? (
                      (() => {
                        const opt = deliveryOptions.find((o) => o.type === selectedDeliveryType);
                        return (
                          <>
                            <opt.Icon className="w-5 h-5 mr-3 text-[var(--color-gold)]" />
                            <div className="text-sm font-medium text-gray-800">{opt.title}</div>
                          </>
                        );
                      })()
                    ) : (
                      <div className="text-sm text-gray-500">{getTranslation('Select the format you want', selectedLanguage)}</div>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {deliveryDropdownOpen && (
                  <div className="absolute z-30 mt-2 w-full rounded-xl" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(243,244,246,1)', boxShadow: '0 8px 20px rgba(2,6,23,0.06)' }}>
                    <ul ref={deliveryListRef} role="listbox" aria-label="Delivery formats" className="divide-y divide-gray-100">
                      {deliveryOptions.map((option) => (
                        <li
                          key={option.type}
                          role="option"
                          tabIndex={0}
                          aria-selected={selectedDeliveryType === option.type}
                          onClick={() => { handleSelectDelivery(option.type); setDeliveryDropdownOpen(false); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectDelivery(option.type);
                              setDeliveryDropdownOpen(false);
                            }
                          }}
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <option.Icon className={`w-5 h-5 mr-3 ${selectedDeliveryType === option.type ? 'text-[var(--color-gold)]' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{getTranslation(option.title, selectedLanguage)}</div>
                            <div className="text-xs text-gray-500">{getTranslation(option.subtitle, selectedLanguage)}</div>
                          </div>
                          {selectedDeliveryType === option.type && (
                            <Check className="w-4 h-4 text-[var(--color-gold)]" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            {/* --- END: Delivery Type Selection Cards --- */}
            </>
          </div>
        )}
        {description.length >= MIN_CHARS && title && title.length >= MIN_TITLE_CHARS && (
          /* --- Dynamic Form Content based on Selection --- */

          selectedDeliveryType === "one-time" && !isTransitioning ? (
            /* SHOW ONE-TIME VIDEO DETAILS */
            oneTimeStep === 1 ? (
              <OneTimeVideoDetails
                description={description}
                setDescription={setDescription}
                title={title}
                setTitle={setTitle}
                MAX_CHARS={MAX_CHARS}
                selectedLanguage={selectedLanguage}
              />
            ) : oneTimeStep === 2 ? (
              <VideoLengthStep
                selectedLength={selectedVideoLength}
                setSelectedLength={setSelectedVideoLength}
                customLength={customVideoLength}
                setCustomLength={setCustomVideoLength}
                selectedLanguage={selectedLanguage}
              />
            ) : oneTimeStep === 3 ? (
              <ToneStyleStep
                selectedTones={selectedTones}
                setSelectedTones={setSelectedTones}
                selectedStyles={selectedStyles}
                setSelectedStyles={setSelectedStyles}
                selectedLanguage={selectedLanguage}
              />
            ) : oneTimeStep === 4 ? (
              <PrivacySettingsStep
                selectedPrivacy={selectedPrivacy}
                setSelectedPrivacy={setSelectedPrivacy}
                prevStepCompleted={true}
                selectedLanguage={selectedLanguage}
              />
            ) : oneTimeStep === 5 ? (
              <ReviewRequestStep
                title={title}
                description={description}
                selectedDeliveryType={selectedDeliveryType}
                selectedTones={selectedTones}
                selectedVideoLength={selectedVideoLength}
                customVideoLength={customVideoLength}
                uploadedFiles={uploadedFiles}
                referenceLinks={referenceLinks}
                selectedPrivacy={selectedPrivacy}
                customPrice={customPrice}
                setCustomPrice={setCustomPrice}
                editingPrice={editingPrice}
                setEditingPrice={setEditingPrice}
                priceInput={priceInput}
                setPriceInput={setPriceInput}
                priceInputRef={priceInputRef}
                savePrice={savePrice}
                displayPrice={displayPrice}
                sanitizePriceInput={sanitizePriceInput}
                onEdit={() => setOneTimeStep(1)}
                onSaveReview={handleSaveReview}
                selectedLanguage={selectedLanguage}
              />
            ) : (
              <SponsorConfirmation selectedLanguage={selectedLanguage} />
            )
          ) : selectedDeliveryType === "recurrent" && !isTransitioning ? (
            /* SHOW RECURRENT VIDEO DETAILS (New multi-step flow) */
            recurrentStep === 3 ? (
              <VideoLengthStep
                selectedLength={selectedVideoLength}
                setSelectedLength={setSelectedVideoLength}
                customLength={customVideoLength}
                setCustomLength={setCustomVideoLength}
                selectedLanguage={selectedLanguage}
              />
            ) : recurrentStep === 4 ? (
              <ToneStyleStep
                selectedTones={selectedTones}
                setSelectedTones={setSelectedTones}
                selectedStyles={selectedStyles}
                setSelectedStyles={setSelectedStyles}
                selectedLanguage={selectedLanguage}
              />
            ) : recurrentStep === 5 ? (
              <PrivacySettingsStep
                selectedPrivacy={selectedPrivacy}
                setSelectedPrivacy={setSelectedPrivacy}
                prevStepCompleted={true}
                selectedLanguage={selectedLanguage}
              />
            ) : recurrentStep === 6 ? (
              <ReviewRequestStep
                title={title}
                description={description}
                selectedDeliveryType={selectedDeliveryType}
                selectedFrequency={selectedFrequency}
                customRecurrentDates={customRecurrentDates}
                selectedTones={selectedTones}
                selectedVideoLength={selectedVideoLength}
                customVideoLength={customVideoLength}
                uploadedFiles={uploadedFiles}
                referenceLinks={referenceLinks}
                selectedPrivacy={selectedPrivacy}
                customPrice={customPrice}
                setCustomPrice={setCustomPrice}
                editingPrice={editingPrice}
                setEditingPrice={setEditingPrice}
                priceInput={priceInput}
                setPriceInput={setPriceInput}
                priceInputRef={priceInputRef}
                savePrice={savePrice}
                displayPrice={displayPrice}
                sanitizePriceInput={sanitizePriceInput}
                onEdit={() => setRecurrentStep(1)}
                onSaveReview={handleSaveReview}
                selectedLanguage={selectedLanguage}
              />
            ) : recurrentStep === 7 ? (
              <SponsorConfirmation selectedLanguage={selectedLanguage} />
            ) : (
              <RecurrentVideoDetails
                description={description}
                setDescription={setDescription}
                title={title}
                setTitle={setTitle}
                MAX_CHARS={MAX_CHARS}
                MIN_CHARS={MIN_CHARS}
                recurrentStep={recurrentStep}
                selectedFrequency={selectedFrequency}
                setSelectedFrequency={setSelectedFrequency}
                selectedTones={selectedTones}
                setSelectedTones={setSelectedTones}
                selectedStyles={selectedStyles}
                setSelectedStyles={setSelectedStyles}
                selectedPrivacy={selectedPrivacy}
                setSelectedPrivacy={setSelectedPrivacy}
                customRecurrentDates={customRecurrentDates}
                setCustomRecurrentDates={setCustomRecurrentDates}
                selectedLanguage={selectedLanguage}
                // Pass missing props
                setRecurrentStep={setRecurrentStep}
                selectedDeliveryType={selectedDeliveryType}
                selectedVideoLength={selectedVideoLength}
                customVideoLength={customVideoLength}
                uploadedFiles={uploadedFiles}
                referenceLinks={referenceLinks}
                customPrice={customPrice}
                setCustomPrice={setCustomPrice}
                editingPrice={editingPrice}
                setEditingPrice={setEditingPrice}
                priceInput={priceInput}
                setPriceInput={setPriceInput}
                priceInputRef={priceInputRef}
                savePrice={savePrice}
                displayPrice={displayPrice}
                sanitizePriceInput={sanitizePriceInput}
                handleSaveReview={handleSaveReview}
              />
            )
          ) : selectedDeliveryType === "series" && !isTransitioning ? (
            /* SHOW SERIES VIDEO DETAILS (New multi-step flow) */
            seriesStep === 3 ? (
              <VideoLengthStep
                selectedLength={selectedVideoLength}
                setSelectedLength={setSelectedVideoLength}
                customLength={customVideoLength}
                setCustomLength={setCustomVideoLength}
                selectedLanguage={selectedLanguage}
              />
            ) : seriesStep === 4 ? (
              <ToneStyleStep
                selectedTones={selectedTones}
                setSelectedTones={setSelectedTones}
                selectedStyles={selectedStyles}
                setSelectedStyles={setSelectedStyles}
                selectedLanguage={selectedLanguage}
              />
            ) : seriesStep === 5 ? (
              <PrivacySettingsStep
                selectedPrivacy={selectedPrivacy}
                setSelectedPrivacy={setSelectedPrivacy}
                prevStepCompleted={true}
                selectedLanguage={selectedLanguage}
              />
            ) : seriesStep === 6 ? (
              <ReviewRequestStep
                title={title}
                description={description}
                selectedDeliveryType={selectedDeliveryType}
                numberOfEpisodes={numberOfEpisodes}
                selectedReleaseSchedule={selectedReleaseSchedule}
                customSeriesDates={customSeriesDates}
                selectedTones={selectedTones}
                selectedVideoLength={selectedVideoLength}
                customVideoLength={customVideoLength}
                uploadedFiles={uploadedFiles}
                referenceLinks={referenceLinks}
                selectedPrivacy={selectedPrivacy}
                customPrice={customPrice}
                setCustomPrice={setCustomPrice}
                editingPrice={editingPrice}
                setEditingPrice={setEditingPrice}
                priceInput={priceInput}
                setPriceInput={setPriceInput}
                priceInputRef={priceInputRef}
                savePrice={savePrice}
                displayPrice={displayPrice}
                sanitizePriceInput={sanitizePriceInput}
                onEdit={() => setSeriesStep(1)}
                onSaveReview={handleSaveReview}
                selectedLanguage={selectedLanguage}
              />
            ) : seriesStep === 7 ? (
              <SponsorConfirmation selectedLanguage={selectedLanguage} />
            ) : (
              <SeriesVideoDetails
                description={description}
                setDescription={setDescription}
                title={title}
                setTitle={setTitle}
                MAX_CHARS={MAX_CHARS}
                seriesStep={seriesStep}
                numberOfEpisodes={numberOfEpisodes}
                setNumberOfEpisodes={setNumberOfEpisodes}
                selectedReleaseSchedule={selectedReleaseSchedule}
                setSelectedReleaseSchedule={setSelectedReleaseSchedule}
                selectedTones={selectedTones}
                setSelectedTones={setSelectedTones}
                customSeriesDates={customSeriesDates}
                setCustomSeriesDates={setCustomSeriesDates}
                selectedPrivacy={selectedPrivacy}
                setSelectedPrivacy={setSelectedPrivacy}
                selectedLanguage={selectedLanguage}
              />
            )
          ) : selectedDeliveryType === "catalogue" && !isTransitioning ? ( // NEW CATALOGUE RENDER
            /* SHOW CATALOGUE VIDEO DETAILS (New multi-step flow) */
            catalogueStep === 3 ? (
              <VideoLengthStep
                selectedLength={selectedVideoLength}
                setSelectedLength={setSelectedVideoLength}
                customLength={customVideoLength}
                setCustomLength={setCustomVideoLength}
                selectedLanguage={selectedLanguage}
              />
            ) : catalogueStep === 4 ? (
              <ToneStyleStep
                selectedTones={selectedTones}
                setSelectedTones={setSelectedTones}
                selectedStyles={selectedStyles}
                setSelectedStyles={setSelectedStyles}
                selectedLanguage={selectedLanguage}
              />
            ) : catalogueStep === 5 ? (
              <PrivacySettingsStep
                selectedPrivacy={selectedPrivacy}
                setSelectedPrivacy={setSelectedPrivacy}
                prevStepCompleted={true}
                selectedLanguage={selectedLanguage}
              />
            ) : catalogueStep === 6 ? (
              <ReviewRequestStep
                title={title}
                description={description}
                selectedDeliveryType={selectedDeliveryType}
                targetVideos={targetVideos}
                themes={themes}
                selectedTones={selectedTones}
                selectedVideoLength={selectedVideoLength}
                customVideoLength={customVideoLength}
                uploadedFiles={uploadedFiles}
                referenceLinks={referenceLinks}
                selectedPrivacy={selectedPrivacy}
                customPrice={customPrice}
                setCustomPrice={setCustomPrice}
                editingPrice={editingPrice}
                setEditingPrice={setEditingPrice}
                priceInput={priceInput}
                setPriceInput={setPriceInput}
                selectedLanguage={selectedLanguage}
                priceInputRef={priceInputRef}
                savePrice={savePrice}
                displayPrice={displayPrice}
                sanitizePriceInput={sanitizePriceInput}
                onEdit={() => setCatalogueStep(1)}
                onSaveReview={handleSaveReview}
              />
            ) : catalogueStep === 7 ? (
              <SponsorConfirmation selectedLanguage={selectedLanguage} />
            ) : (
              <CatalogueVideoDetails
                description={description}
                setDescription={setDescription}
                title={title}
                setTitle={setTitle}
                MAX_CHARS={MAX_CHARS}
                MIN_CHARS={MIN_CHARS}
                catalogueStep={catalogueStep}
                targetVideos={targetVideos}
                setTargetVideos={setTargetVideos}
                themes={themes}
                setThemes={setThemes}
                selectedTones={selectedTones}
                setSelectedTones={setSelectedTones}
                selectedPrivacy={selectedPrivacy}
                setSelectedPrivacy={setSelectedPrivacy}
                selectedLanguage={selectedLanguage}
              />
            )
          ) : (
            /* SHOW INITIAL PROMPT & SELECTION CARDS */
            <>
              {/* Generic Text Input (Hidden if selection is made, shown as initial prompt) */}
              <div className="relative mb-8 mt-0">
                <textarea
                  rows="4"
                  placeholder={getTranslation('What do you want creators to make (Min {min} characters, e.g., "A single video on...")', selectedLanguage).replace('{min}', MIN_CHARS)}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value.slice(0, MAX_CHARS))
                  }
                  onBlur={() => setTouchedDescription(true)}
                  className="w-full p-5 text-gray-700 border border-gray-200 rounded-xl focus:ring-0 focus:border-gray-300 transition duration-150 resize-none outline-none text-base"
                  style={{
                    boxShadow:
                      "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                  }}
                ></textarea>
                <span className="absolute bottom-4 right-4 text-xs text-gray-400 font-medium">
                  {description.length}/{MAX_CHARS} char
                </span>
                {touchedDescription && description.length < MIN_CHARS && (
                  <p className="mt-2 text-xs text-red-500">
                    Please enter at least {MIN_CHARS} characters to continue.
                  </p>
                )}
              </div>

              {/* Progressive Disclosure: Only show options if description meets min length */}
              {description.length >= MIN_CHARS && (
                <div>
                  {/* Examples moved above to appear before delivery options */}
                </div>
              )}
            </>
          )
        )}
      </main>

      {/* Action Bar/Footer Separator and Button */}
      <div className="w-full max-w-lg mx-auto px-5 z-10 pb-28 mt-auto" style={{ backgroundColor: '#F8F8FA' }}>
        <div className="border-t border-gray-200 w-full" />

        <div className="w-full py-6">
          {isPremiumStep ? (
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleNext}
                className="w-full h-12 rounded-xl flex items-center justify-center space-x-2 text-[15px] font-medium text-white shadow-sm hover:opacity-90 transition duration-200"
                style={{
                  backgroundColor: ACTIVE_BG_COLOR,
                  boxShadow: ACTIVE_SHADOW,
                }}
              >
                <span>{getTranslation('Continue', selectedLanguage)}</span>
              </button>
              <button
                onClick={handleNext}
                className="w-full h-12 rounded-xl flex items-center justify-center text-[15px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition duration-200"
              >
                {getTranslation('Skip', selectedLanguage)}
              </button>
            </div>
          ) : (
            /* Hide the Next/Back CTA when we're on the final success step (sponsor confirmation)
               so the sponsor card isn't followed by an unrelated action button. */
            !isSuccessStep && (
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleNext}
                  disabled={!isNextEnabled}
                  className={`
                                    w-full h-12 rounded-xl flex items-center justify-center space-x-2
                                    text-[15px] font-medium transition-all duration-200
                                    ${!isNextEnabled
                      ? "bg-gray-100 text-gray-400 opacity-70 cursor-not-allowed"
                      : "text-white hover:opacity-95 active:scale-[0.98]"
                    }
                                    ${isAnimating ? "scale-[1.01]" : ""} 
                                `}
                  style={
                    isNextEnabled
                      ? {
                        backgroundColor: ACTIVE_BG_COLOR,
                        boxShadow: "0 4px 12px rgba(6,24,58,0.16)", // Softer, more spread out navy shadow
                        color: "white",
                      }
                      : {}
                  }
                >
                  <span>{getNextLabel()}</span>
                  {/* Hide the arrow on the final success step */}
                  {!(isSeries && seriesStep === 8) &&
                    !(isCatalogue && catalogueStep === 8) &&
                    !(isRecurrent && recurrentStep === 8) &&
                    !(selectedDeliveryType === "one-time" && oneTimeStep === 7) && (
                      <ArrowRight className="w-4 h-4" />
                    )}
                </button>

                {isFormatSelected && !isSuccessStep && (
                  <button
                    onClick={handleBack}
                    className="w-full h-12 rounded-xl flex items-center justify-center text-[15px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition duration-200"
                  >
                    {getTranslation('Back', selectedLanguage)}
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* --- Post-selection message and examples for chosen format --- */}
      {formatSelectedMessage && (
        <div className="mt-3 flex items-center text-sm font-normal text-[var(--color-accent)] animate-in fade-in">
          <Check className="w-4 h-4 mr-2 text-[var(--color-accent)]" />
          <span>{formatSelectedMessage}</span>
        </div>
      )}

      {/* Per-format examples removed — keep only the top 'Examples to help you choose:' block */}

      {/* Shared edit row for any selected format */}
      {selectedDeliveryType && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span className="italic">{selectedDeliveryType === 'one-time' ? getTranslation('Using the Description and Title you entered above for this one-time video.', selectedLanguage) : selectedDeliveryType === 'recurrent' ? getTranslation('Using the Description and Title you entered above for this recurring request.', selectedLanguage) : selectedDeliveryType === 'series' ? getTranslation('Using the Description and Title you entered above for this series.', selectedLanguage) : selectedDeliveryType === 'catalogue' ? getTranslation('Using the Description and Title you entered above for this catalogue.', selectedLanguage) : getTranslation('Using the Description and Title you entered above for this one-time video.', selectedLanguage)}</span>
          <button
            type="button"
            className="ml-4 text-sm font-medium text-[var(--color-accent)] hover:underline"
            onClick={() => {
              const el = document.getElementById("description-input");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.focus();
                el.classList.add("jump-highlight");
                setTimeout(() => el.classList.remove("jump-highlight"), 900);
              }
              const titleEl = document.getElementById("title-input");
              if (titleEl) {
                setTimeout(() => {
                  titleEl.focus();
                  titleEl.classList.add("jump-highlight");
                  setTimeout(() => titleEl.classList.remove("jump-highlight"), 900);
                }, 300);
              }
            }}
          >
            {getTranslation('Edit', selectedLanguage)}
          </button>
        </div>
      )}
      {/* Floating See Preview button (fixed) */}
      <button
        onClick={() => setPreviewModalOpen((s) => !s)}
        className={`fixed right-5 bottom-36 px-4 py-2 rounded-full shadow-lg text-sm font-normal flex items-center space-x-2 ${previewModalOpen ? 'bg-[var(--color-gold)] text-white z-60' : 'bg-[var(--surface)] text-gray-800 border border-gray-100'}`}
        style={previewModalOpen ? { border: '1px solid rgba(var(--color-gold-rgb,203,138,0),0.22)' } : {}}
        aria-label={previewModalOpen ? getTranslation('Close preview', selectedLanguage) : getTranslation('See preview', selectedLanguage)}
      >
        <span>{previewModalOpen ? getTranslation('Close preview', selectedLanguage) : getTranslation('See preview', selectedLanguage)}</span>
      </button>

      {/* debug badge removed */}

      {/* Preview Modal (dim background + centered preview card) */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black opacity-20"
            onClick={() => setPreviewModalOpen(false)}
          />

          <div className="relative z-50 w-full max-w-3xl mx-auto px-6" style={{ maxWidth: '720px' }} >
            <div className="modal-dialog bg-white p-6 rounded-2xl border border-gray-100 shadow-2xl" style={{ maxHeight: '72vh', overflowY: 'auto', boxShadow: '0 24px 54px rgba(2,6,23,0.28)' }}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base font-semibold text-gray-900">Preview</h3>
              </div>

              {/* Reuse preview layout (mirrors in-page preview) */}
              <div className="relative mb-2 overflow-hidden">
                <div
                  className="bg-white p-5 pb-4 rounded-3xl border border-gray-50 relative z-10 preview-card"
                  style={{ paddingRight: "20px" }}
                >


                  <div className="absolute top-4 right-4 flex flex-col items-end space-y-1 z-10">
                    <div
                      style={{
                        backgroundColor: "var(--brand-gold)",
                        color: "white",
                        fontWeight: 700,
                        padding: "6px 10px",
                        borderRadius: "0 10px 0 10px",
                        fontSize: 13,
                      }}
                    >
                      {editingPrice ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            savePrice();
                          }}
                        >
                          <input
                            ref={priceInputRef}
                            type="text"
                            inputMode="decimal"
                            pattern="^\d*(\.\d{0,2})?$"
                            value={priceInput}
                            onChange={(e) =>
                              setPriceInput(sanitizePriceInput(e.target.value))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                savePrice();
                              }
                            }}
                            onBlur={() => savePrice()}
                            className="text-right"
                            style={{
                              background: "transparent",
                              color: "white",
                              border: "none",
                              outline: "none",
                              width: "64px",
                              fontWeight: 700,
                            }}
                          />
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setPriceInput((displayPrice || 0).toFixed(2));
                            setEditingPrice(true);
                          }}
                          style={{
                            background: "transparent",
                            color: "inherit",
                            border: "none",
                            padding: 0,
                          }}
                        >
                          {"$" + (displayPrice || 0).toFixed(2)}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full">
                      RANK #
                    </div>
                  </div>

                  <div className="flex items-start mb-4 relative z-10 pt-6">
                    <div className="flex items-center">
                      <div
                        className="w-14 h-14 rounded-full overflow-hidden mr-4 flex-shrink-0 relative bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-700"
                        role={selectedCreator ? 'button' : undefined}
                        onClick={() => {
                          if (selectedCreator) {
                            setProfileCreator(selectedCreator);
                            setShowCreatorProfile(true);
                          }
                        }}
                      >
                        {selectedCreator && (selectedCreator.photoURL || selectedCreator.image || selectedCreator.avatar) ? (
                          <img src={selectedCreator.photoURL || selectedCreator.image || selectedCreator.avatar} alt={selectedCreator.name || selectedCreator.handle} className="w-full h-full object-cover" />
                        ) : (
                          (() => {
                            const displayName = (selectedCreator && (selectedCreator.displayName || selectedCreator.name)) || (auth && auth.user && (auth.user.name || auth.user.handle)) || 'Y';
                            const seed = String(selectedCreator ? (selectedCreator.id || selectedCreator.name || selectedCreator.handle || "") : "");
                            const colors = ["#60A5FA", "#EF4444", "#8B5E3C", "#FBBF24"];
                            let hash = 0;
                            for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
                            const bg = colors[Math.abs(hash) % colors.length];
                            const letter = displayName.toString().replace(/@/, '').charAt(0).toUpperCase();
                            return (
                              <div style={{ width: '100%', height: '100%', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                {letter}
                              </div>
                            );
                          })()
                        )}
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold text-gray-900"
                          role={selectedCreator ? 'button' : undefined}
                          onClick={() => {
                            if (selectedCreator) {
                              setProfileCreator(selectedCreator);
                              setShowCreatorProfile(true);
                            }
                          }}
                        >
                          {(selectedCreator && (selectedCreator.displayName || selectedCreator.name)) || (auth && auth.user && (auth.user.name || 'You'))}
                        </p>
                        <p className="text-sm text-gray-500">Just now</p>
                      </div>
                    </div>
                  </div>

                  <h2
                    className="text-lg font-extrabold text-gray-900 mb-2 leading-tight"
                    style={{
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {title || ""}
                  </h2>
                  <p className="text-sm text-gray-800 mb-2 break-words">
                    {description || ""}
                  </p>

                  <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                    <div className="flex space-x-3 text-gray-600">
                      <div className="flex items-center space-x-1.5 text-gray-500">
                        <Heart className="w-4 h-4" />
                        <span className="text-xs">0</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-gray-500">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs">
                          {referenceLinks?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <ChevronsUp className="w-3.5 h-3.5" />
                        <span style={{ fontSize: '10px' }}>Boosts</span>
                      </div>
                    </div>

                    <div className="flex space-x-1.5">
                      <div className="p-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--bg)] transition-colors ring-1 ring-gray-200">
                        <Bookmark className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="p-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--bg)] transition-colors ring-1 ring-gray-200">
                        <Lightbulb className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Page Overlay (Premium Apple-style Full Screen) */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white animate-fade-in">
          {/* Back Button (Top Left) */}
          <div className="absolute top-4 left-8 z-10">
             <button
                onClick={() => {
                  setPaymentModalOpen(false);
                  setPendingSubmission(null);
                  trackEvent("payment_cancelled");
                }}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <MoveLeft size={32} />
              </button>
          </div>

          <div className="min-h-screen flex flex-col items-center pt-16 pb-20 px-6 max-w-lg mx-auto w-full">
              {/* Header - Enhanced spacing and hierarchy */}
              <div className="text-center mb-14">
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">
                  {getTranslation('Complete Payment', selectedLanguage)}
                </h2>
                <p className="text-base text-gray-500 leading-relaxed">
                   {getTranslation('Secure your request with a payment to attract top creators.', selectedLanguage)}
                </p>
              </div>

              {/* Main Amount Display - Hero price, much more prominent */}
              <div className="mb-14 text-center">
                 <div className="text-7xl font-black text-gray-900 tracking-tighter mb-3 leading-none">
                    ${Number((paymentAmount * (paymentRole === 'expert' ? 1.3 : 1)) + privacyCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </div>
                 {paymentRole === 'expert' && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 text-xs font-bold uppercase tracking-wide">
                       <Crown size={12} /> Expert multiplier active (1.3x)
                    </span>
                 )}
              </div>

              {/* Presets Grid - Glassmorphic + soft shadows */}
              <div className="grid grid-cols-3 gap-4 w-full mb-12">
                 {PAYMENT_PRESETS.slice(0, 3).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPaymentAmount(p);
                        trackEvent("preset_selected", { preset: p });
                      }}
                      className={`relative group flex flex-col items-center justify-center py-8 px-4 rounded-3xl transition-all duration-300 ${
                        paymentAmount === p 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-2xl shadow-blue-500/40 scale-110' 
                          : 'bg-white/40 backdrop-blur-md border border-white/60 hover:shadow-xl hover:shadow-gray-200/50'
                      }`}
                    >
                       <div className={`text-3xl font-black tracking-tight`}>
                          ${p}
                       </div>
                       {p === 25 && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full shadow-lg flex items-center justify-center">
                             <span className="text-xl leading-none">✨</span>
                          </div>
                       )}
                    </button>
                 ))}
              </div>

              {/* Custom Amount - Ghost style input */}
               <div className="w-full mb-14">
                  {(() => {
                    // Calculate minimum based on creator's price or fallback to $15
                    const creatorMinimum = (selectedCreator && selectedCreator.price && Number(selectedCreator.price) > 0) 
                      ? Math.max(15, Number(selectedCreator.price)) 
                      : 15;
                    return (
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">$</span>
                        <input
                          type="number"
                          min={creatorMinimum}
                          value={paymentAmount}
                          onChange={(e) => {
                            const v = Math.max(creatorMinimum, Number(e.target.value || 0));
                            setPaymentAmount(v);
                            trackEvent("custom_amount_input", { amount: v });
                          }}
                          className="w-full pl-11 pr-5 py-4 bg-transparent border-b-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 font-semibold text-gray-900 focus:outline-none transition-all text-lg placeholder-gray-300"
                          placeholder="Custom amount"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-xs text-gray-400">Min ${creatorMinimum}</div>
                      </div>
                    );
                  })()}
              </div>

              {/* Role / Creator Selection - Modern segmented control */}
              <div className="w-full mb-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full p-1.5 shadow-md">
                 <div className="grid grid-cols-2 gap-1">
                    <button
                       onClick={() => setPaymentRole('creator')}
                       className={`py-3 px-6 rounded-full text-sm font-bold transition-all duration-200 ${
                          paymentRole === 'creator' 
                             ? 'bg-white text-gray-900 shadow-lg shadow-gray-200/50' 
                             : 'text-gray-600 hover:text-gray-900'
                       }`}
                    >
                       Standard
                    </button>
                    <button
                       onClick={() => setPaymentRole('expert')}
                       className={`py-3 px-6 rounded-full text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                          paymentRole === 'expert'
                             ? 'bg-white text-purple-700 shadow-lg shadow-purple-200/50' 
                             : 'text-gray-600 hover:text-gray-900'
                       }`}
                    >
                       Expert <Crown size={16} />
                    </button>
                 </div>
              </div>
                
              {/* Specific Creator Selector with Search */}
              <div className="w-full mb-12">
                 <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4">Target Specific Creator (Optional)</div>
                 {!selectedCreator ? (
                    <>
                       <div className="relative mb-3">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">@</span>
                          <input
                             ref={chooseCreatorInputRef}
                             type="text"
                             placeholder="Search creators..."
                             value={creatorSearch}
                             onChange={(e) => setCreatorSearch(e.target.value.replace(/^@+/, ""))}
                             className="w-full pl-10 pr-10 py-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-gray-400"
                             autoFocus={chooseCreatorFocused}
                          />
                          {creatorSearch && (
                             <button
                                onClick={() => setCreatorSearch("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                             >
                                <X size={18} />
                             </button>
                          )}
                       </div>
                       {(creatorSearch || creatorsList.length > 0) && (
                          <div className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm overflow-hidden">
                             {filteredCreators.length > 0 ? (
                                <div className="max-h-56 overflow-y-auto space-y-0">
                                   {filteredCreators.slice(0, 8).map((c) => {
                                      const avatarUrl = c.photoURL || c.image;
                                      return (
                                      <button
                                         key={c.id}
                                         onClick={() => {
                                            setSelectedCreator(c);
                                            setCreatorSearch("");
                                            trackEvent("creator_selected", { creatorId: c.id });
                                         }}
                                         className="w-full flex items-center gap-3 p-3 hover:bg-blue-50/50 transition-colors text-left border-b border-gray-100 last:border-b-0 active:scale-95"
                                      >
                                         <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-sm font-bold shadow-md" style={{ backgroundColor: avatarUrl ? 'transparent' : (c.fallbackColor || '#3b82f6') }}>
                                            {avatarUrl ? (
                                               <img src={avatarUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
                                            ) : (
                                               (c.name || 'U').charAt(0).toUpperCase()
                                            )}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 truncate">{c.displayName || c.name}</div>
                                            {c.price ? <div className="text-xs text-gray-500">${c.price}/request</div> : null}
                                         </div>
                                      </button>
                                   );})}
                                </div>
                             ) : creatorSearch ? (
                                <div className="p-6 text-center">
                                   <div className="text-4xl mb-2">😕</div>
                                   <div className="text-sm font-medium text-gray-600">No creators found</div>
                                   <div className="text-xs text-gray-400 mt-1">Try a different search term</div>
                                </div>
                             ) : null}
                          </div>
                       )}
                    </>
                 ) : (
                    <div className="flex items-center justify-between w-full border border-blue-200 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-2xl p-4 backdrop-blur-sm">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-400 flex-shrink-0 shadow-md flex items-center justify-center flex-none">
                             {(selectedCreatorImage || selectedCreator.photoURL || selectedCreator.image) ? (
                                <img src={selectedCreatorImage || selectedCreator.photoURL || selectedCreator.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />
                             ) : null}
                             <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold" style={{ display: (selectedCreatorImage || selectedCreator.photoURL || selectedCreator.image) ? 'none' : 'flex' }}>
                                {(selectedCreator.name || 'U').replace(/^@+/, '').charAt(0).toUpperCase()}
                             </div>
                          </div>
                          <div className="min-w-0">
                             <div className="text-sm font-bold text-gray-900">{selectedCreator.displayName || selectedCreator.name}</div>
                             <div className="text-xs text-blue-600 font-semibold">Selected Creator</div>
                          </div>
                       </div>
                       <button onClick={() => setSelectedCreator(null)} className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-400 hover:text-red-500 flex-shrink-0 active:scale-90">
                          <X size={18} />
                       </button>
                    </div>
                 )}
              </div>

              {/* Footer Actions */}
              <div className="w-full mt-auto space-y-4">
                 <a
                    href="https://www.paypal.com/ncp/payment/L7D8KYJEZM35L"
                    onClick={() => {
                        const base = paymentAmount;
                        const withRole = paymentRole === "expert" ? Math.round(base * 1.3 * 100) / 100 : base;
                        trackEvent("payment_confirmed", {
                           amount: withRole,
                           role: paymentRole,
                           creator: selectedCreator ? selectedCreator.id : null,
                        });
                    }}
                    className="block w-full py-5 rounded-2xl bg-black text-white text-center font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3 relative overflow-hidden group"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex items-center gap-2 tracking-tight">
                       Pay with PayPal <ArrowRight size={20} />
                    </span>
                 </a>

                 <div className="text-center">
                    <button
                        onClick={() => {
                           trackEvent("free_submission_clicked");
                           handleFreeSubmission();
                        }}
                        className="text-gray-500 font-semibold hover:text-gray-900 transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 active:scale-95"
                    >
                       Submit for free (may take longer or be ignored)
                    </button>
                 </div>
                 
                 <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-8 pt-6 border-t border-gray-100">
                    <Lock size={12} /> Secure encrypted payment • Powered by PayPal
                 </div>
              </div>
          </div>
        </div>
      )}

      {/* Creator Selection Modal for Ideas Page */}
      {showCreatorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{getTranslation('Choose Creator', selectedLanguage)}</h2>
              <button
                onClick={() => setShowCreatorModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-6 border-b border-gray-100">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                <input
                  type="text"
                  placeholder={getTranslation('Search creators', selectedLanguage)}
                  value={creatorSearch}
                  onChange={(e) => setCreatorSearch(e.target.value.replace(/^@+/, ""))}
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                  autoFocus
                />
                {creatorSearch && (
                  <button
                    onClick={() => setCreatorSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Creator List */}
            <div className="flex-1 overflow-y-auto">
              {creatorsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Users size={40} className="text-gray-300 mb-3" />
                  <div className="text-sm font-medium text-gray-900">{getTranslation('No creators found', selectedLanguage)}</div>
                  <div className="text-xs text-gray-500 mt-1">{getTranslation('Try a different username', selectedLanguage)}</div>
                </div>
              ) : filteredCreators.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Search size={40} className="text-gray-300 mb-3" />
                  <div className="text-sm font-medium text-gray-900">{getTranslation('No creators found', selectedLanguage)}</div>
                  <div className="text-xs text-gray-500 mt-1">{getTranslation('Try a different username', selectedLanguage)}</div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredCreators.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCreator(c);
                        setShowCreatorModal(false);
                        try {
                          window.localStorage.setItem(SELECTED_CREATOR_KEY, JSON.stringify(c));
                        } catch (e) { }
                      }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${selectedCreator?.id === c.id ? 'bg-blue-50' : ''}`}
                    >
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden"
                        style={{
                          backgroundColor: (c.photoURL || c.image) ? 'transparent' : (c.fallbackColor || '#3b82f6'),
                        }}
                      >
                        {(c.photoURL || c.image) ? (
                          <img
                            src={c.photoURL || c.image}
                            alt={c.name}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          String(c.name || 'U').replace("@", "").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{c.displayName || c.name}</div>
                        {c.price ? (
                          <div className="text-xs text-gray-500">${c.price} per request</div>
                        ) : (
                          <div className="text-xs text-gray-400">Not set</div>
                        )}
                      </div>
                      {selectedCreator?.id === c.id && (
                        <Check size={18} className="text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setShowCreatorModal(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                {getTranslation('Done', selectedLanguage)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Free Request Submitted Modal */}
      {showFreeRequestSubmittedModal && (
        <FreeRequestSubmittedModal
          onClose={() => {
            setShowFreeRequestSubmittedModal(false);
            setCurrentFreeRequest(null);
            const focusId = currentFreeRequest?.id ? `&focus=${encodeURIComponent(String(currentFreeRequest.id))}` : '';
            navigate(`/requests?filter=For You${focusId}`);
          }}
          onBoostRequest={() => {
            setShowFreeRequestSubmittedModal(false);
            setCurrentRequestIdForBoost(currentFreeRequest?.id);
            setCurrentFreeRequest(null);
            setShowBoostsModal(true);
          }}
          onInviteContributors={() => {
            // Don't navigate - let the share dialog stay open
            // The modal will stay visible so user can continue interacting
          }}
          onViewDetails={() => {
            setShowFreeRequestSubmittedModal(false);
            setCurrentFreeRequest(null);
            // Navigate directly to the newly created request
            const focusId = currentFreeRequest?.id ? `&focus=${encodeURIComponent(String(currentFreeRequest.id))}` : '';
            navigate(`/requests?filter=For You${focusId}`);
          }}
          requestData={currentFreeRequest}
          selectedLanguage={selectedLanguage}
        />
      )}

      {/* Boosts Modal for Free Request */}
      {showBoostsModal && currentRequestIdForBoost && (
        <BoostsModal
          isOpen={showBoostsModal}
          onClose={() => {
            setShowBoostsModal(false);
            setCurrentRequestIdForBoost(null);
          }}
          requestId={currentRequestIdForBoost}
          detailedRank={{ totalInfluence: 0 }}
          onGiveLikeFree={() => { /* optional */ }}
          selectedLanguage={selectedLanguage}
        />
      )}

      <MobileNav active={activeNav} onChange={setActiveNav} selectedLanguage={selectedLanguage} />
    </div>
  );
};

export default App;
