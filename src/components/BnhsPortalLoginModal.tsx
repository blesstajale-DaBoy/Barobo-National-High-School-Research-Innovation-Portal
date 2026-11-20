import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  Send,
} from 'lucide-react';
import {
  BNHS_PORTAL_ROLES,
  BnhsPortalRole,
  DEFAULT_PORTAL_LOGO_URL,
  getRoleDefinition,
  isAdminRole,
  verifyPortalPassword,
  changePortalPassword,
  resetForgotPortalPassword,
} from '../utils/portalAuth';

export type BnhsAccountRole = BnhsPortalRole;

export interface BnhsPortalUserSession {
  uid: string;
  displayName: string;
  email: string;
  accountRole: BnhsPortalRole;
  isAdmin: boolean;
  authMethod: 'google' | 'portal_password';
  mustChangePassword?: boolean;
}

export type LoginModalViewMode = 'login' | 'change_password' | 'forgot_password';

interface BnhsPortalLoginModalProps {
  isOpen: boolean;
  initialView?: LoginModalViewMode;
  currentSession?: BnhsPortalUserSession | null;
  portalLogoUrl?: string;
  onClose: () => void;
  onLoginSuccess: (session: BnhsPortalUserSession) => void;
  onGoogleSignIn: () => Promise<void>;
  onPasswordChanged?: (message: string) => void;
  onForgotPasswordDispatched?: (info: {
    recipientEmail: string;
    subject: string;
    messageBody: string;
  }) => void;
}

type CatMood =
  | 'idle'
  | 'tracking'
  | 'password_closed'
  | 'peeking'
  | 'sad_forgot'
  | 'happy_jump'
  | 'error';

/**
 * Interactive Cute Cat SVG Mascot with expressive real-time animations:
 * - Always alive: continuous eye movement/blinking & gently wagging tail
 * - Inputting password: eyes visibly close softly; done inputting (blur): eyes open back up
 * - Show password toggle: peeks playfully with one open eye
 * - Forgot Password mode: sad watery eyes, worried brows, droopy ears & actively swinging tail
 * - Change Password mode & success: happy ^ ^ squinting eyes, rosy cheeks & joyful jumping bounce!
 */
const CuteCatMascot: React.FC<{
  mood: CatMood;
  gazeOffset: number; // -1 (left) to +1 (right)
  isSadTracking?: boolean;
}> = ({ mood, gazeOffset, isSadTracking = false }) => {
  const clampedGaze = Math.max(-1, Math.min(1, gazeOffset));
  const pupilX = clampedGaze * 4.8;
  const pupilY = mood === 'sad_forgot' ? 3.2 : mood === 'tracking' ? 2.6 : 0.8;
  const headTilt =
    mood === 'tracking'
      ? clampedGaze * 4
      : mood === 'peeking'
      ? -5
      : mood === 'sad_forgot'
      ? -3.5
      : 0;

  const isPasswordClosed = mood === 'password_closed';
  const isPeeking = mood === 'peeking';
  const isSad = mood === 'sad_forgot';
  const isHappyJump = mood === 'happy_jump';
  const isError = mood === 'error';
  const isIdle = mood === 'idle';

  const tailAnimClass = isSad
    ? 'cat-tail-swing-sad'
    : isHappyJump
    ? 'cat-tail-wag-happy'
    : 'cat-tail-wag-gentle';

  return (
    <div className="relative flex flex-col items-center select-none pointer-events-none">
      {/* Subtle status speech pill */}
      <div
        className={`mb-1 px-2.5 py-0.5 text-[10px] font-mono font-semibold tracking-wide transition-all duration-300 border ${
          isHappyJump
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : isSad
            ? 'bg-amber-50 text-amber-900 border-amber-300'
            : isError
            ? 'bg-red-50 text-red-700 border-red-200'
            : isPasswordClosed
            ? 'bg-amber-50 text-amber-900 border-amber-200'
            : isPeeking
            ? 'bg-rose-50 text-[#6B1420] border-rose-200'
            : 'bg-[#FAF9F5] text-zinc-600 border-zinc-200'
        }`}
      >
        {isHappyJump && 'Yay! Happy eyes & jumping for your new password!'}
        {isSad && 'Aw, forgot password? Swinging tail while we recover it...'}
        {isError && 'Oops! Please check your credentials again'}
        {isPasswordClosed && 'Eyes closed while you type your secret password!'}
        {isPeeking && 'Just a tiny peek to check your password...'}
        {mood === 'tracking' && 'Watching you type your credentials...'}
        {mood === 'idle' && 'Meow! Choose your BNHS role below'}
      </div>

      <div
        className={`w-40 h-32 sm:w-44 sm:h-36 transition-transform duration-300 ${
          isError ? 'cat-wiggle-error' : ''
        }`}
        style={{
          transform: `rotate(${headTilt}deg)`,
        }}
      >
        <svg
          viewBox="0 0 220 185"
          className="w-full h-full drop-shadow-md overflow-visible"
          aria-hidden="true"
        >
          {/* Ground shadow — shrinks & expands in sync when cat jumps */}
          <ellipse
            cx="110"
            cy="170"
            rx="68"
            ry="10"
            fill="#6B1420"
            opacity="0.14"
            className={isHappyJump ? 'cat-shadow-jump' : ''}
            style={{ transformOrigin: '110px 170px' }}
          />

          {/* Main animated cat body group (jumps joyfully on Change Password / Happy!) */}
          <g className={isHappyJump ? 'cat-body-jump' : ''} style={{ transformOrigin: '110px 155px' }}>
            {/* Happy Sparkles floating above when jumping in Change Password */}
            {isHappyJump && (
              <g className="cat-sparkles">
                <path
                  d="M 32 42 L 35 34 L 38 42 L 46 45 L 38 48 L 35 56 L 32 48 L 24 45 Z"
                  fill="#F59E0B"
                />
                <path
                  d="M 184 36 L 186.5 29 L 189 36 L 196 38.5 L 189 41 L 186.5 48 L 184 41 L 177 38.5 Z"
                  fill="#F59E0B"
                />
                <circle cx="48" cy="24" r="3" fill="#F472B6" />
                <circle cx="172" cy="22" r="2.8" fill="#10B981" />
              </g>
            )}

            {/* Animated Tail (always gently moving; swings widely when sad/forgot; wags rapidly when happy/jumping) */}
            <g className={tailAnimClass} style={{ transformOrigin: '162px 144px' }}>
              <path
                d={
                  isHappyJump
                    ? 'M 160 144 Q 208 118 194 78'
                    : isSad
                    ? 'M 160 146 Q 204 156 200 120'
                    : 'M 160 144 Q 202 132 192 98'
                }
                fill="none"
                stroke="#6B1420"
                strokeWidth="15"
                strokeLinecap="round"
                style={{ transition: 'd 300ms ease' }}
              />
              <path
                d={
                  isHappyJump
                    ? 'M 160 144 Q 208 118 194 78'
                    : isSad
                    ? 'M 160 146 Q 204 156 200 120'
                    : 'M 160 144 Q 202 132 192 98'
                }
                fill="none"
                stroke="#E9A96B"
                strokeWidth="11"
                strokeLinecap="round"
                style={{ transition: 'd 300ms ease' }}
              />
              <path
                d={
                  isHappyJump
                    ? 'M 160 144 Q 208 118 194 78'
                    : isSad
                    ? 'M 160 146 Q 204 156 200 120'
                    : 'M 160 144 Q 202 132 192 98'
                }
                fill="none"
                stroke="#FFF4E4"
                strokeWidth="4"
                strokeDasharray="6 10"
                strokeLinecap="round"
              />
            </g>

            {/* Cat shoulders / body */}
            <path
              d="M 54 166 C 54 128, 75 114, 110 114 C 145 114, 166 128, 166 166 Z"
              fill="#F4BA7E"
              stroke="#6B1420"
              strokeWidth="2.5"
            />
            {/* Cream chest fluff */}
            <ellipse cx="110" cy="148" rx="28" ry="18" fill="#FFF7EB" />

            {/* BNHS Maroon Academic Bowtie */}
            <g transform="translate(110, 130)">
              <polygon points="0,0 -18,-9 -18,9" fill="#6B1420" />
              <polygon points="0,0 18,-9 18,9" fill="#6B1420" />
              <circle cx="0" cy="0" r="5" fill="#F59E0B" stroke="#6B1420" strokeWidth="1.5" />
            </g>

            {/* Left Ear */}
            <g
              style={{
                transformOrigin: '64px 58px',
                transform: isError
                  ? 'rotate(-24deg) translateY(6px)'
                  : isSad
                  ? 'rotate(-16deg) translateY(4px)'
                  : isHappyJump
                  ? 'rotate(8deg) translateY(-2px)'
                  : 'rotate(0deg)',
                transition: 'transform 280ms ease',
              }}
            >
              <path
                d="M 52 74 L 42 24 L 88 47 Z"
                fill="#F4BA7E"
                stroke="#6B1420"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path d="M 56 66 L 50 34 L 79 50 Z" fill="#F9B8C4" />
            </g>

            {/* Right Ear */}
            <g
              style={{
                transformOrigin: '156px 58px',
                transform: isError
                  ? 'rotate(24deg) translateY(6px)'
                  : isSad
                  ? 'rotate(16deg) translateY(4px)'
                  : isHappyJump
                  ? 'rotate(-8deg) translateY(-2px)'
                  : 'rotate(0deg)',
                transition: 'transform 280ms ease',
              }}
            >
              <path
                d="M 168 74 L 178 24 L 132 47 Z"
                fill="#F4BA7E"
                stroke="#6B1420"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path d="M 164 66 L 170 34 L 141 50 Z" fill="#F9B8C4" />
            </g>

            {/* Head */}
            <ellipse
              cx="110"
              cy="86"
              rx="60"
              ry="50"
              fill="#F6C38A"
              stroke="#6B1420"
              strokeWidth="2.5"
            />

            {/* Forehead tabby stripes */}
            <path
              d="M 97 40 Q 100 52 98 58 M 110 37 Q 110 51 110 60 M 123 40 Q 120 52 122 58"
              stroke="#C97D3D"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Cream muzzle */}
            <ellipse cx="110" cy="105" rx="28" ry="18" fill="#FFF7EB" />

            {/* Cheeks blush */}
            <ellipse
              cx="68"
              cy="100"
              rx="10.5"
              ry="6.5"
              fill="#F472B6"
              opacity={isHappyJump ? 0.6 : isSad ? 0.18 : 0.3}
              style={{ transition: 'opacity 250ms ease' }}
            />
            <ellipse
              cx="152"
              cy="100"
              rx="10.5"
              ry="6.5"
              fill="#F472B6"
              opacity={isHappyJump ? 0.6 : isSad ? 0.18 : 0.3}
              style={{ transition: 'opacity 250ms ease' }}
            />

            {/* Whiskers */}
            <g stroke="#6B1420" strokeWidth="1.8" strokeLinecap="round" opacity="0.65">
              <line x1="36" y1="94" x2="62" y2="98" />
              <line x1="34" y1="105" x2="61" y2="105" />
              <line x1="39" y1="115" x2="63" y2="111" />
              <line x1="184" y1="94" x2="158" y2="98" />
              <line x1="186" y1="105" x2="159" y2="105" />
              <line x1="181" y1="115" x2="157" y2="111" />
            </g>

            {/* ==================== EXPRESSIVE EYES ==================== */}
            {isHappyJump ? (
              /* Happy squinting eyes ^ ^ (Change Password & Success!) */
              <g
                fill="none"
                stroke="#3B1A1E"
                strokeWidth="3.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M 73 85 Q 86 69 99 85" />
                <path d="M 121 85 Q 134 69 147 85" />
                {/* Cheerful tiny outer eye sparkle */}
                <circle cx="71" cy="76" r="1.8" fill="#F59E0B" stroke="none" />
                <circle cx="149" cy="76" r="1.8" fill="#F59E0B" stroke="none" />
              </g>
            ) : isPasswordClosed ? (
              /* Closed Eyes while inputting password (clearly visible closed curved eyelids!) */
              <g>
                {/* Soft eyelid shade */}
                <ellipse cx="86" cy="82" rx="13.5" ry="12" fill="#F3B87A" opacity="0.6" />
                <ellipse cx="134" cy="82" rx="13.5" ry="12" fill="#F3B87A" opacity="0.6" />
                <g
                  fill="none"
                  stroke="#3B1A1E"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Left closed eyelid arc */}
                  <path d="M 73 81 Q 86 91 99 81" />
                  <line x1="77" y1="86" x2="74" y2="90" strokeWidth="2.2" />
                  <line x1="86" y1="88" x2="86" y2="92" strokeWidth="2.2" />
                  <line x1="95" y1="86" x2="98" y2="90" strokeWidth="2.2" />
                  {/* Right closed eyelid arc */}
                  <path d="M 121 81 Q 134 91 147 81" />
                  <line x1="125" y1="86" x2="122" y2="90" strokeWidth="2.2" />
                  <line x1="134" y1="88" x2="134" y2="92" strokeWidth="2.2" />
                  <line x1="143" y1="86" x2="146" y2="90" strokeWidth="2.2" />
                </g>
              </g>
            ) : isError ? (
              /* Worried >< eyes on invalid password */
              <g
                fill="none"
                stroke="#6B1420"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M 78 76 L 93 85 L 78 92" />
                <path d="M 142 76 L 127 85 L 142 92" />
              </g>
            ) : isSad ? (
              /* Sad watery eyes with worried droopy eyebrows & glistening teardrops (Forgot Password!) */
              <g>
                {/* Worried sad eyebrows tilted upward toward center */}
                <path
                  d="M 72 68 Q 84 65 95 59"
                  fill="none"
                  stroke="#6B1420"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                <path
                  d="M 148 68 Q 136 65 125 59"
                  fill="none"
                  stroke="#6B1420"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />

                {/* Left Sad Eye */}
                <circle cx="86" cy="83" r="13.5" fill="#FFFFFF" stroke="#6B1420" strokeWidth="2" />
                <g
                  style={{
                    transform: isSadTracking
                      ? `translate(${pupilX * 0.7}px, 3px)`
                      : 'translate(-1.5px, 3px)',
                    transition: 'transform 200ms ease-out',
                  }}
                >
                  <circle cx="86" cy="83" r="8" fill="#2A1215" />
                  {/* Extra glossy teary highlights */}
                  <circle cx="82.5" cy="79" r="3.2" fill="#FFFFFF" />
                  <circle cx="89.5" cy="85.5" r="1.9" fill="#DBEAFE" />
                  <circle cx="84.5" cy="88" r="1.3" fill="#93C5FD" />
                </g>
                {/* Animated falling teardrop on left eye */}
                <path
                  d="M 74 93 C 74 93 70 99 74 101 C 78 99 74 93 74 93 Z"
                  fill="#60A5FA"
                  className="cat-teardrop"
                />

                {/* Right Sad Eye */}
                <circle cx="134" cy="83" r="13.5" fill="#FFFFFF" stroke="#6B1420" strokeWidth="2" />
                <g
                  style={{
                    transform: isSadTracking
                      ? `translate(${pupilX * 0.7}px, 3px)`
                      : 'translate(1.5px, 3px)',
                    transition: 'transform 200ms ease-out',
                  }}
                >
                  <circle cx="134" cy="83" r="8" fill="#2A1215" />
                  <circle cx="130.5" cy="79" r="3.2" fill="#FFFFFF" />
                  <circle cx="137.5" cy="85.5" r="1.9" fill="#DBEAFE" />
                  <circle cx="132.5" cy="88" r="1.3" fill="#93C5FD" />
                </g>
                {/* Watery shimmer under right eye */}
                <ellipse cx="144" cy="94" rx="3" ry="1.8" fill="#93C5FD" opacity="0.85" />
              </g>
            ) : isPeeking ? (
              /* Left eye closed, right eye playfully open & peeking */
              <g>
                <path
                  d="M 73 82 Q 86 90 99 82"
                  fill="none"
                  stroke="#3B1A1E"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                />
                <circle cx="134" cy="82" r="13.5" fill="#FFFFFF" stroke="#6B1420" strokeWidth="2" />
                <g style={{ transform: 'translate(-2px, 2px)' }}>
                  <circle cx="134" cy="82" r="7.5" fill="#2A1215" />
                  <circle cx="131" cy="78.5" r="2.6" fill="#FFFFFF" />
                  <circle cx="137" cy="85" r="1.2" fill="#FFFFFF" />
                </g>
              </g>
            ) : (
              /* Open expressive eyes: actively look around gently when idle, track typing cursor when typing, and blink naturally */
              <g className="cat-eyes-blink" style={{ transformOrigin: '110px 82px' }}>
                {/* Left Eye */}
                <circle cx="86" cy="82" r="13.5" fill="#FFFFFF" stroke="#6B1420" strokeWidth="2" />
                <g
                  className={isIdle ? 'cat-pupils-idle' : ''}
                  style={
                    isIdle
                      ? undefined
                      : {
                          transform: `translate(${pupilX}px, ${pupilY}px)`,
                          transition: 'transform 140ms ease-out',
                        }
                  }
                >
                  <circle cx="86" cy="82" r="7.5" fill="#2A1215" />
                  <circle cx="83" cy="78.5" r="2.6" fill="#FFFFFF" />
                  <circle cx="89" cy="85" r="1.2" fill="#FFFFFF" />
                </g>

                {/* Right Eye */}
                <circle cx="134" cy="82" r="13.5" fill="#FFFFFF" stroke="#6B1420" strokeWidth="2" />
                <g
                  className={isIdle ? 'cat-pupils-idle' : ''}
                  style={
                    isIdle
                      ? undefined
                      : {
                          transform: `translate(${pupilX}px, ${pupilY}px)`,
                          transition: 'transform 140ms ease-out',
                        }
                  }
                >
                  <circle cx="134" cy="82" r="7.5" fill="#2A1215" />
                  <circle cx="131" cy="78.5" r="2.6" fill="#FFFFFF" />
                  <circle cx="137" cy="85" r="1.2" fill="#FFFFFF" />
                </g>
              </g>
            )}

            {/* Cute pink triangle nose */}
            <polygon points="104,97 116,97 110,104" fill="#E87A90" stroke="#6B1420" strokeWidth="1.2" />

            {/* Mouth */}
            {isError || isSad ? (
              <path
                d="M 101 114 Q 110 106 119 114"
                fill="none"
                stroke="#6B1420"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            ) : isHappyJump ? (
              <g>
                <path
                  d="M 96 106 Q 103 114 110 106 Q 117 114 124 106"
                  fill="none"
                  stroke="#6B1420"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 104 110 Q 110 120 116 110"
                  fill="#F472B6"
                  stroke="#6B1420"
                  strokeWidth="1.5"
                />
              </g>
            ) : (
              <path
                d="M 98 107 Q 104 113 110 106 Q 116 113 122 107"
                fill="none"
                stroke="#6B1420"
                strokeWidth="2.3"
                strokeLinecap="round"
              />
            )}

            {/* LEFT PAW: raises playfully on cheeks during password input (keeping closed eyes clearly visible!), cheers upward when jumping */}
            <g
              style={{
                transform: isPasswordClosed
                  ? 'translate(10px, -44px) rotate(18deg)'
                  : isPeeking
                  ? 'translate(22px, -66px) rotate(16deg)'
                  : isHappyJump
                  ? 'translate(-12px, -30px) rotate(-26deg)'
                  : isSad
                  ? 'translate(6px, -6px) rotate(8deg)'
                  : 'translate(0px, 0px) rotate(0deg)',
                transformOrigin: '64px 156px',
                transition: 'transform 300ms cubic-bezier(0.34, 1.45, 0.64, 1)',
              }}
            >
              <ellipse
                cx="64"
                cy="156"
                rx="20"
                ry="16"
                fill="#FFF4E4"
                stroke="#6B1420"
                strokeWidth="2.4"
              />
              {/* Paw beans */}
              <circle cx="56" cy="152" r="3.2" fill="#F9B8C4" />
              <circle cx="64" cy="149" r="3.4" fill="#F9B8C4" />
              <circle cx="72" cy="152" r="3.2" fill="#F9B8C4" />
              <ellipse cx="64" cy="159" rx="6" ry="4" fill="#F9B8C4" />
            </g>

            {/* RIGHT PAW */}
            <g
              style={{
                transform: isPasswordClosed
                  ? 'translate(-10px, -44px) rotate(-18deg)'
                  : isPeeking
                  ? 'translate(-10px, -28px) rotate(-8deg)'
                  : isHappyJump
                  ? 'translate(12px, -30px) rotate(26deg)'
                  : isSad
                  ? 'translate(-6px, -6px) rotate(-8deg)'
                  : 'translate(0px, 0px) rotate(0deg)',
                transformOrigin: '156px 156px',
                transition: 'transform 300ms cubic-bezier(0.34, 1.45, 0.64, 1)',
              }}
            >
              <ellipse
                cx="156"
                cy="156"
                rx="20"
                ry="16"
                fill="#FFF4E4"
                stroke="#6B1420"
                strokeWidth="2.4"
              />
              {/* Paw beans */}
              <circle cx="148" cy="152" r="3.2" fill="#F9B8C4" />
              <circle cx="156" cy="149" r="3.4" fill="#F9B8C4" />
              <circle cx="164" cy="152" r="3.2" fill="#F9B8C4" />
              <ellipse cx="156" cy="159" rx="6" ry="4" fill="#F9B8C4" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

export const BnhsPortalLoginModal: React.FC<BnhsPortalLoginModalProps> = ({
  isOpen,
  initialView = 'login',
  currentSession = null,
  portalLogoUrl = DEFAULT_PORTAL_LOGO_URL,
  onClose,
  onLoginSuccess,
  onGoogleSignIn,
  onPasswordChanged,
  onForgotPasswordDispatched,
}) => {
  const [viewMode, setViewMode] = useState<LoginModalViewMode>(initialView);
  const [selectedRole, setSelectedRole] = useState<BnhsPortalRole>(
    currentSession?.accountRole || 'Teacher Researcher'
  );
  const [fullName, setFullName] = useState<string>(currentSession?.displayName || '');
  const [email, setEmail] = useState<string>(currentSession?.email || '');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showDefaultsDrawer, setShowDefaultsDrawer] = useState<boolean>(false);

  // Change password fields
  const [currentPwd, setCurrentPwd] = useState<string>('');
  const [newPwd, setNewPwd] = useState<string>('');
  const [confirmNewPwd, setConfirmNewPwd] = useState<string>('');
  const [showChangePwds, setShowChangePwds] = useState<boolean>(false);

  // Forgot password state
  const [resetResult, setResetResult] = useState<{
    generatedPassword: string;
    recipientEmail: string;
    subject: string;
    body: string;
    mailtoUrl: string;
  } | null>(null);
  const [copiedResetPwd, setCopiedResetPwd] = useState<boolean>(false);

  // Animation & Feedback states
  const [catMood, setCatMood] = useState<CatMood>('idle');
  const [gazeOffset, setGazeOffset] = useState<number>(0);
  const [isSadTracking, setIsSadTracking] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const getDefaultMoodForView = (mode: LoginModalViewMode): CatMood => {
    if (mode === 'forgot_password') return 'sad_forgot';
    if (mode === 'change_password') return 'happy_jump';
    return 'idle';
  };

  useEffect(() => {
    if (!isOpen) return;
    setViewMode(initialView);
    setSelectedRole(currentSession?.accountRole || 'Teacher Researcher');
    setFullName(currentSession?.displayName || '');
    setEmail(currentSession?.email || '');
    setPassword('');
    setCurrentPwd('');
    setNewPwd('');
    setConfirmNewPwd('');
    setErrorMsg('');
    setSuccessMsg('');
    setResetResult(null);
    setCatMood(getDefaultMoodForView(initialView));
    setGazeOffset(0);
    setIsSadTracking(false);
    setShowPassword(false);
    setShowChangePwds(false);
  }, [isOpen, initialView, currentSession]);

  if (!isOpen) return null;

  const activeRoleDef = getRoleDefinition(selectedRole);

  const switchViewMode = (nextMode: LoginModalViewMode) => {
    setViewMode(nextMode);
    setErrorMsg('');
    setSuccessMsg('');
    if (nextMode === 'forgot_password') {
      setResetResult(null);
    }
    setIsSadTracking(false);
    setCatMood(getDefaultMoodForView(nextMode));
  };

  const updateGazeFromText = (val: string) => {
    const ratio = Math.min(val.length / 26, 1);
    setGazeOffset(ratio * 2 - 1);
    if (viewMode === 'forgot_password') {
      setIsSadTracking(true);
      setCatMood('sad_forgot');
    } else if (viewMode === 'change_password') {
      setCatMood('happy_jump');
    } else {
      setCatMood('tracking');
    }
  };

  const handleTextFieldBlur = () => {
    setIsSadTracking(false);
    setCatMood(getDefaultMoodForView(viewMode));
  };

  const handlePasswordFocus = (isVisible: boolean) => {
    setCatMood(isVisible ? 'peeking' : 'password_closed');
  };

  const handlePasswordBlur = () => {
    // Done inputting password -> eyes open immediately (or return to happy_jump in Change Password!)
    setCatMood(getDefaultMoodForView(viewMode));
  };

  const handleTogglePasswordVisibility = () => {
    const next = !showPassword;
    setShowPassword(next);
    setCatMood(next ? 'peeking' : 'password_closed');
  };

  const handleToggleChangePwdVisibility = () => {
    const next = !showChangePwds;
    setShowChangePwds(next);
    setCatMood(next ? 'peeking' : 'password_closed');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanName = fullName.trim() || `${selectedRole} (BNHS)`;
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid institutional or personal email address.');
      setCatMood('error');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password (or use the role default password).');
      setCatMood('error');
      return;
    }

    setSubmitting(true);
    try {
      const check = await verifyPortalPassword(selectedRole, cleanEmail, password);
      if (!check.valid) {
        setErrorMsg(
          `Incorrect password for ${selectedRole}. Click "View Default Role Passwords" below or use "Forgot Password?" to receive a generated password via email.`
        );
        setCatMood('error');
        return;
      }

      setCatMood('happy_jump');
      setSuccessMsg(
        check.mustChangePassword
          ? 'Signed in with temporary password! You can update your password anytime from Change Password.'
          : `Welcome, ${cleanName}! Signed in as ${selectedRole}.`
      );

      const cleanUid = `bnhs_${selectedRole
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')}_${cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 14)}`;

      const session: BnhsPortalUserSession = {
        uid: cleanUid,
        displayName: cleanName,
        email: cleanEmail,
        accountRole: selectedRole,
        isAdmin: isAdminRole(selectedRole),
        authMethod: 'portal_password',
        mustChangePassword: check.mustChangePassword,
      };

      setTimeout(() => {
        onLoginSuccess(session);
        onClose();
      }, 750);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to verify credentials.');
      setCatMood('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetRole = currentSession?.accountRole || selectedRole;
    const targetEmail = (currentSession?.email || email).trim().toLowerCase();

    if (!targetEmail) {
      setErrorMsg('Please sign in first or provide your registered email address.');
      setCatMood('error');
      return;
    }
    if (newPwd.trim().length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      setCatMood('error');
      return;
    }
    if (newPwd !== confirmNewPwd) {
      setErrorMsg('New password and confirmation do not match.');
      setCatMood('error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await changePortalPassword(targetRole, targetEmail, currentPwd, newPwd);
      if (!res.ok) {
        setErrorMsg(res.error || 'Could not change password.');
        setCatMood('error');
        return;
      }
      setCatMood('happy_jump');
      const msg = `Password updated successfully for ${targetRole} (${targetEmail}).`;
      setSuccessMsg(msg);
      if (onPasswordChanged) onPasswordChanged(msg);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmNewPwd('');
      setTimeout(() => {
        onClose();
      }, 1250);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter your registered email address so we can send your generated password.');
      setCatMood('sad_forgot');
      return;
    }

    setSubmitting(true);
    try {
      const result = await resetForgotPortalPassword(selectedRole, cleanEmail);
      setResetResult(result);
      setCatMood('sad_forgot');
      setSuccessMsg(
        `A secure temporary password has been generated and dispatched for ${cleanEmail}.`
      );
      if (onForgotPasswordDispatched) {
        onForgotPasswordDispatched({
          recipientEmail: result.recipientEmail,
          subject: result.subject,
          messageBody: result.body,
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reset password.');
      setCatMood('sad_forgot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyGeneratedPassword = () => {
    if (!resetResult) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(resetResult.generatedPassword);
      setCopiedResetPwd(true);
      setTimeout(() => setCopiedResetPwd(false), 2000);
    }
  };

  const handleGooglePopup = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await onGoogleSignIn();
      setCatMood('happy_jump');
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Google Sign-In popup was dismissed or blocked.'
      );
      setCatMood('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 p-2.5 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bnhs-cat-login-title"
    >
      <style>{`
        @keyframes catWiggle {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-7px) rotate(-3deg); }
          75% { transform: translateX(7px) rotate(3deg); }
        }
        @keyframes catTailWagGentle {
          0%, 100% { transform: rotate(-9deg); }
          50% { transform: rotate(12deg); }
        }
        @keyframes catTailSwingSad {
          0%, 100% { transform: rotate(-22deg); }
          50% { transform: rotate(22deg); }
        }
        @keyframes catTailWagHappy {
          0%, 100% { transform: rotate(-16deg); }
          50% { transform: rotate(18deg); }
        }
        @keyframes catPupilsIdle {
          0%, 100% { transform: translate(0px, 0.5px); }
          20% { transform: translate(-4px, 0px); }
          45% { transform: translate(4px, 0.5px); }
          70% { transform: translate(2px, -1.5px); }
          88% { transform: translate(-2px, 1px); }
        }
        @keyframes catEyesBlink {
          0%, 44%, 48%, 92%, 96%, 100% { transform: scaleY(1); }
          46%, 94% { transform: scaleY(0.08); }
        }
        @keyframes catBodyJump {
          0%, 100% { transform: translateY(0px) scale(1, 1); }
          15% { transform: translateY(4px) scale(1.04, 0.94); }
          45% { transform: translateY(-18px) scale(0.97, 1.05); }
          75% { transform: translateY(2px) scale(1.03, 0.96); }
        }
        @keyframes catShadowJump {
          0%, 100% { transform: scaleX(1); opacity: 0.14; }
          15% { transform: scaleX(1.06); opacity: 0.18; }
          45% { transform: scaleX(0.68); opacity: 0.08; }
          75% { transform: scaleX(1.04); opacity: 0.16; }
        }
        @keyframes catTeardropFall {
          0%, 100% { transform: translateY(0px); opacity: 0.9; }
          60% { transform: translateY(7px); opacity: 0.95; }
          85% { transform: translateY(11px); opacity: 0; }
          86% { transform: translateY(0px); opacity: 0; }
        }
        @keyframes catSparklesPulse {
          0%, 100% { opacity: 0.95; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.88); }
        }
        .cat-wiggle-error {
          animation: catWiggle 0.38s ease-in-out 2;
        }
        .cat-tail-wag-gentle {
          animation: catTailWagGentle 2.5s ease-in-out infinite;
        }
        .cat-tail-swing-sad {
          animation: catTailSwingSad 1.35s ease-in-out infinite;
        }
        .cat-tail-wag-happy {
          animation: catTailWagHappy 0.65s ease-in-out infinite;
        }
        .cat-pupils-idle {
          animation: catPupilsIdle 4.8s ease-in-out infinite;
        }
        .cat-eyes-blink {
          animation: catEyesBlink 4.6s ease-in-out infinite;
        }
        .cat-body-jump {
          animation: catBodyJump 0.85s ease-in-out infinite;
        }
        .cat-shadow-jump {
          animation: catShadowJump 0.85s ease-in-out infinite;
        }
        .cat-teardrop {
          animation: catTeardropFall 1.9s ease-in infinite;
        }
        .cat-sparkles {
          animation: catSparklesPulse 0.9s ease-in-out infinite;
          transform-origin: 110px 40px;
        }
      `}</style>

      <div className="bg-white border border-zinc-200 shadow-2xl w-full max-w-2xl my-auto overflow-hidden">
        {/* Institutional Maroon Header */}
        <div className="bg-[#6B1420] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 border-b border-rose-950">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={portalLogoUrl || DEFAULT_PORTAL_LOGO_URL}
              alt="BNHS Research Portal Official Seal"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-contain bg-white p-0.5 shrink-0 border border-amber-300/60"
            />
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] font-mono text-amber-300 uppercase tracking-wider truncate">
                Barobo National High School · Interactive Role Access
              </div>
              <h2
                id="bnhs-cat-login-title"
                className="text-base sm:text-lg font-display font-semibold text-white truncate"
              >
                {viewMode === 'login' && 'BNHS Portal Login'}
                {viewMode === 'change_password' && 'Change Account Password'}
                {viewMode === 'forgot_password' && 'Forgot Password · Email Recovery'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-rose-100 hover:text-white transition-colors shrink-0"
            aria-label="Close login modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="max-h-[84vh] overflow-y-auto bg-[#FAF9F5]">
          {/* Interactive Cute Cat Stage */}
          <div className="pt-4 pb-1 px-4 flex flex-col items-center justify-center bg-gradient-to-b from-rose-50/80 via-[#FAF9F5] to-white border-b border-zinc-200">
            <CuteCatMascot
              mood={catMood}
              gazeOffset={gazeOffset}
              isSadTracking={isSadTracking}
            />
          </div>

          {/* Mode Tabs Bar */}
          <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => switchViewMode('login')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  viewMode === 'login'
                    ? 'bg-[#6B1420] text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchViewMode('change_password')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                  viewMode === 'change_password'
                    ? 'bg-[#6B1420] text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
              <button
                type="button"
                onClick={() => switchViewMode('forgot_password')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                  viewMode === 'forgot_password'
                    ? 'bg-[#6B1420] text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Forgot Password</span>
              </button>
            </div>

            {currentSession && (
              <div className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span className="truncate max-w-[200px]">
                  Active: {currentSession.accountRole}
                </span>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 bg-white space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ==================== VIEW 1: LOGIN FORM ==================== */}
            {viewMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* 7 Institutional Roles Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-900">
                    1. Select Your Institutional Role (7 Roles) <span className="text-[#6B1420]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BNHS_PORTAL_ROLES.map((item) => {
                      const active = selectedRole === item.role;
                      return (
                        <button
                          key={item.role}
                          type="button"
                          onClick={() => {
                            setSelectedRole(item.role);
                            setErrorMsg('');
                            setCatMood('idle');
                          }}
                          className={`text-left p-2.5 border transition-colors flex items-start gap-2.5 ${
                            active
                              ? 'border-[#6B1420] bg-rose-50/70 ring-1 ring-[#6B1420]'
                              : 'border-zinc-200 bg-[#FAF9F5] hover:border-zinc-300'
                          }`}
                        >
                          <div
                            className={`mt-0.5 shrink-0 ${
                              active ? 'text-[#6B1420]' : 'text-zinc-500'
                            }`}
                          >
                            {item.isAdmin ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : item.role === 'Student Researcher' ? (
                              <GraduationCap className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div
                              className={`text-xs font-semibold leading-tight ${
                                active ? 'text-[#6B1420]' : 'text-zinc-900'
                              }`}
                            >
                              {item.role}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                              {item.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1">
                      2. Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onFocus={() => updateGazeFromText(fullName)}
                      onBlur={handleTextFieldBlur}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        updateGazeFromText(e.target.value);
                      }}
                      placeholder={activeRoleDef.defaultNamePlaceholder}
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1">
                      3. Email Address <span className="text-[#6B1420]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onFocus={() => updateGazeFromText(email)}
                        onBlur={handleTextFieldBlur}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          updateGazeFromText(e.target.value);
                        }}
                        placeholder="name@deped.gov.ph or email@gmail.com"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Field (triggers Cat Paws Covering Eyes!) */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="text-xs font-semibold text-zinc-800">
                      4. Account Password <span className="text-[#6B1420]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => switchViewMode('forgot_password')}
                      className="text-[11px] font-semibold text-[#6B1420] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onFocus={() => handlePasswordFocus(showPassword)}
                      onBlur={handlePasswordBlur}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        handlePasswordFocus(showPassword);
                      }}
                      placeholder={`Enter password (default: ${activeRoleDef.defaultPassword})`}
                      className="w-full pl-9 pr-10 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                    />
                    <button
                      type="button"
                      onClick={handleTogglePasswordVisibility}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-[#6B1420]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Default Passwords Reference Drawer */}
                <div className="border border-zinc-200 bg-[#FAF9F5]">
                  <button
                    type="button"
                    onClick={() => setShowDefaultsDrawer((prev) => !prev)}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-[11px] font-semibold text-zinc-700 hover:text-[#6B1420]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        Default Password for {selectedRole}:{' '}
                        <code className="font-mono text-[#6B1420] bg-white px-1.5 py-0.5 border border-zinc-200">
                          {activeRoleDef.defaultPassword}
                        </code>
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-zinc-500">
                      <span>All 7 Defaults</span>
                      {showDefaultsDrawer ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>

                  {showDefaultsDrawer && (
                    <div className="px-3.5 pb-3 pt-1 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                      {BNHS_PORTAL_ROLES.map((r) => (
                        <div
                          key={r.role}
                          className="flex items-center justify-between gap-2 bg-white border border-zinc-200 px-2.5 py-1.5"
                        >
                          <span className="font-medium text-zinc-700 truncate">
                            {r.role}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRole(r.role);
                              setPassword(r.defaultPassword);
                            }}
                            className="font-mono text-[10px] font-semibold text-[#6B1420] hover:underline shrink-0"
                            title="Click to select role and autofill default password"
                          >
                            {r.defaultPassword}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit & Optional Google Sign-In */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleGooglePopup}
                    disabled={submitting}
                    className="px-4 py-2.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                  >
                    Sign In with Google Popup
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-60 transition-colors shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>{submitting ? 'Verifying...' : `Login as ${activeRoleDef.shortLabel}`}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ==================== VIEW 2: CHANGE PASSWORD ==================== */}
            {viewMode === 'change_password' && (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div className="p-3 bg-[#FAF9F5] border border-zinc-200 text-xs text-zinc-700">
                  Update your BNHS Portal password from the default password (or a temporary reset password) to your own private password. Changes are saved immediately for future logins.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1">
                      Account Role
                    </label>
                    <select
                      value={currentSession?.accountRole || selectedRole}
                      disabled={Boolean(currentSession)}
                      onChange={(e) => setSelectedRole(e.target.value as BnhsPortalRole)}
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white disabled:bg-zinc-100 focus:outline-none focus:border-[#6B1420]"
                    >
                      {BNHS_PORTAL_ROLES.map((r) => (
                        <option key={r.role} value={r.role}>
                          {r.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1">
                      Registered Email <span className="text-[#6B1420]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={currentSession?.email || email}
                      disabled={Boolean(currentSession?.email)}
                      onFocus={() => updateGazeFromText(email)}
                      onBlur={handleTextFieldBlur}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        updateGazeFromText(e.target.value);
                      }}
                      placeholder="name@deped.gov.ph"
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white disabled:bg-zinc-100 focus:outline-none focus:border-[#6B1420]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-800">
                      Current Password (or Default / Temporary Password){' '}
                      <span className="text-[#6B1420]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleToggleChangePwdVisibility}
                      className="text-[11px] font-semibold text-[#6B1420] hover:underline inline-flex items-center gap-1"
                    >
                      {showChangePwds ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showChangePwds ? 'Hide' : 'Show'} Passwords</span>
                    </button>
                  </div>
                  <input
                    type={showChangePwds ? 'text' : 'password'}
                    required
                    value={currentPwd}
                    onFocus={() => handlePasswordFocus(showChangePwds)}
                    onBlur={handlePasswordBlur}
                    onChange={(e) => {
                      setCurrentPwd(e.target.value);
                      handlePasswordFocus(showChangePwds);
                    }}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1">
                      New Password (min. 6 chars) <span className="text-[#6B1420]">*</span>
                    </label>
                    <input
                      type={showChangePwds ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPwd}
                      onFocus={() => handlePasswordFocus(showChangePwds)}
                      onBlur={handlePasswordBlur}
                      onChange={(e) => {
                        setNewPwd(e.target.value);
                        handlePasswordFocus(showChangePwds);
                      }}
                      placeholder="Enter new strong password"
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1">
                      Confirm New Password <span className="text-[#6B1420]">*</span>
                    </label>
                    <input
                      type={showChangePwds ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmNewPwd}
                      onFocus={() => handlePasswordFocus(showChangePwds)}
                      onBlur={handlePasswordBlur}
                      onChange={(e) => {
                        setConfirmNewPwd(e.target.value);
                        handlePasswordFocus(showChangePwds);
                      }}
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => switchViewMode('login')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-60 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                    <span>{submitting ? 'Updating...' : 'Save New Password'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ==================== VIEW 3: FORGOT PASSWORD (SEND GENERATED PASSWORD TO EMAIL) ==================== */}
            {viewMode === 'forgot_password' && (
              <div className="space-y-4">
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                    Select your role and enter your registered email address. The portal will generate a new secure temporary password, activate it for your account, and prepare the recovery email to send to your inbox.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-800 mb-1">
                        Institutional Role <span className="text-[#6B1420]">*</span>
                      </label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as BnhsPortalRole)}
                        className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                      >
                        {BNHS_PORTAL_ROLES.map((r) => (
                          <option key={r.role} value={r.role}>
                            {r.role}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-800 mb-1">
                        Registered Email Address <span className="text-[#6B1420]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onFocus={() => updateGazeFromText(email)}
                        onBlur={handleTextFieldBlur}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          updateGazeFromText(e.target.value);
                        }}
                        placeholder="your.email@deped.gov.ph"
                        className="w-full px-3 py-2 text-xs border border-zinc-300 bg-white focus:outline-none focus:border-[#6B1420]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => switchViewMode('login')}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-60 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-300" />
                      <span>
                        {submitting
                          ? 'Generating & Sending...'
                          : 'Generate & Send Password to Email'}
                      </span>
                    </button>
                  </div>
                </form>

                {resetResult && (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-emerald-700" />
                        <span>Generated Password Ready for {resetResult.recipientEmail}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-white border border-emerald-200 px-2 py-0.5 text-emerald-800">
                        Active Immediately
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-emerald-200 px-3 py-2.5">
                      <div>
                        <div className="text-[10px] text-zinc-500 uppercase font-mono">
                          Generated Temporary Password
                        </div>
                        <div className="text-base font-mono font-bold text-[#6B1420] tracking-wider">
                          {resetResult.generatedPassword}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyGeneratedPassword}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                      >
                        {copiedResetPwd ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={resetResult.mailtoUrl}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-300" />
                        <span>Send Password via Email Client</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setPassword(resetResult.generatedPassword);
                          setViewMode('login');
                          setCatMood('idle');
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-amber-300 hover:bg-amber-200 transition-colors"
                      >
                        <span>Use Generated Password to Sign In →</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
