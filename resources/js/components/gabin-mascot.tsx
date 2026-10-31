type Props = {
    className?: string;
    /** Set to false when the mascot is used as a small inline icon. */
    sparkles?: boolean;
};

export default function GabinMascot({ className = '', sparkles = true }: Props) {
    return (
        <svg
            viewBox="0 0 300 300"
            className={className}
            role="img"
            aria-label="Maskot gabin es krim gabinbite.pwt"
        >
            {/* shadow */}
            <ellipse cx="150" cy="265" rx="82" ry="14" fill="#3B2418" opacity="0.15" />

            {/* arms */}
            <path
                d="M81 193c-25-10-34-29-30-50"
                fill="none"
                stroke="#3B2418"
                strokeWidth="7"
                strokeLinecap="round"
            />
            <circle cx="49" cy="140" r="9" fill="#FFE3B8" stroke="#3B2418" strokeWidth="5" />
            <path
                d="M219 190c27-10 38-31 33-53"
                fill="none"
                stroke="#3B2418"
                strokeWidth="7"
                strokeLinecap="round"
            />
            <circle cx="253" cy="134" r="9" fill="#FFE3B8" stroke="#3B2418" strokeWidth="5" />

            {/* feet */}
            <ellipse cx="116" cy="250" rx="24" ry="13" fill="#E3A44F" stroke="#3B2418" strokeWidth="5" />
            <ellipse cx="184" cy="250" rx="24" ry="13" fill="#E3A44F" stroke="#3B2418" strokeWidth="5" />

            {/* bottom biscuit */}
            <ellipse cx="150" cy="218" rx="94" ry="31" fill="#E3A44F" stroke="#3B2418" strokeWidth="6" />
            <ellipse cx="150" cy="211" rx="82" ry="23" fill="#F3C476" />
            <g fill="#D08A35">
                <circle cx="95" cy="214" r="3.2" />
                <circle cx="120" cy="221" r="2.6" />
                <circle cx="150" cy="225" r="3.2" />
                <circle cx="182" cy="219" r="2.6" />
                <circle cx="207" cy="212" r="3" />
            </g>

            {/* ice cream */}
            <path
                d="M56 152c0-48 42-76 94-76s94 28 94 76c0 24-20 36-40 32-16-4-20 12-40 12s-24-16-40-12c-24 4-32 12-48 4-12-6-20-16-20-36z"
                fill="#FF9FBE"
                stroke="#3B2418"
                strokeWidth="6"
                strokeLinejoin="round"
            />
            <path
                d="M84 158c4 24 10 27 20 27s14-10 12-26"
                fill="#FF9FBE"
                stroke="#3B2418"
                strokeWidth="6"
                strokeLinejoin="round"
            />
            <path
                d="M184 159c2 22 8 26 17 26s16-9 14-25"
                fill="#FF9FBE"
                stroke="#3B2418"
                strokeWidth="6"
                strokeLinejoin="round"
            />
            <path
                d="M104 124c14-12 32-18 46-18s32 6 46 18"
                fill="none"
                stroke="#FFD1E0"
                strokeWidth="9"
                strokeLinecap="round"
            />

            {/* sprinkles */}
            <g strokeWidth="6" strokeLinecap="round">
                <path d="M104 148l10-6" stroke="#FFE28A" />
                <path d="M144 132l11 3" stroke="#9BE7C4" />
                <path d="M184 146l10 6" stroke="#FFE28A" />
                <path d="M126 108l9 7" stroke="#C9B6FF" />
                <path d="M174 106l-9 7" stroke="#9BE7C4" />
            </g>

            {/* face */}
            <circle cx="130" cy="140" r="6" fill="#3B2418" />
            <circle cx="170" cy="140" r="6" fill="#3B2418" />
            <circle cx="128" cy="138" r="2" fill="#FFF6E5" />
            <circle cx="168" cy="138" r="2" fill="#FFF6E5" />
            <circle cx="112" cy="152" r="7" fill="#FF6B9A" opacity="0.55" />
            <circle cx="188" cy="152" r="7" fill="#FF6B9A" opacity="0.55" />
            <path
                d="M136 156c8 9 20 9 28 0"
                fill="none"
                stroke="#3B2418"
                strokeWidth="5"
                strokeLinecap="round"
            />

            {/* top biscuit with a bite */}
            <g mask="url(#mascot-bite)">
                <ellipse cx="150" cy="109" rx="94" ry="31" fill="#E3A44F" stroke="#3B2418" strokeWidth="6" />
                <ellipse cx="150" cy="102" rx="82" ry="23" fill="#F3C476" />
                <g fill="#D08A35">
                    <circle cx="96" cy="104" r="3" />
                    <circle cx="122" cy="95" r="3.4" />
                    <circle cx="150" cy="111" r="3" />
                    <circle cx="178" cy="96" r="3.2" />
                    <circle cx="201" cy="108" r="2.8" />
                    <circle cx="136" cy="100" r="2.4" />
                </g>
            </g>

            {/* tiny chocolate drizzle */}
            <path
                d="M92 92c16-12 38-18 58-18"
                fill="none"
                stroke="#B06F28"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.55"
            />

            {sparkles && (
                <g fill="#FFD166">
                    <path d="M42 88l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" />
                    <path d="M256 74l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
                    <circle cx="232" cy="52" r="5" />
                    <circle cx="70" cy="52" r="4" />
                </g>
            )}

            <defs>
                <mask id="mascot-bite">
                    <rect width="300" height="300" fill="#fff" />
                    <circle cx="238" cy="92" r="28" fill="#000" />
                </mask>
            </defs>
        </svg>
    );
}
