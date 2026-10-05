const SKY = '#9CD2FF';
const LAV = '#C9B6FF';
const GRN = '#86D9AE';
const LEAF_A = { resume: SKY, both: SKY, bud: GRN, bloom: GRN };
const LEAF_B = { portfolio: LAV, both: LAV, bud: GRN, bloom: GRN };
const NONE = { stroke: 'none' };

/**
 * น้องต้นกล้า. stage: seed | resume | portfolio | both | bud | bloom
 * mood: happy | worried · hold: none | resume | tag | glass · wave: boolean
 */
export default function Sprout({ stage = 'both', size = 80, mood = 'happy', hold = 'none', wave = false }) {
  const a = LEAF_A[stage];
  const b = LEAF_B[stage];
  const tall = stage === 'bud' || stage === 'bloom';
  const worried = mood === 'worried';
  const bodyFill = stage === 'bloom' ? '#CFF3E0' : '#E6F8EE';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible', fill: 'none', stroke: '#2F5D4B', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}
    >
      <ellipse cx="50" cy="91" rx="32" ry="6" style={{ fill: '#EBD8C3', ...NONE }} />
      {stage === 'seed' ? (
        <g data-anim="bob-slow">
          <ellipse cx="50" cy="79" rx="15" ry="11.5" style={{ fill: '#E6B98C', stroke: '#7A5232' }} />
          <path d="M43 73 Q46 70.5 49 71" style={{ stroke: '#FFF3E2', strokeWidth: 2 }} />
          <circle cx="45" cy="79" r="1.8" style={{ fill: '#3B2F2F', ...NONE }} />
          <circle cx="55" cy="79" r="1.8" style={{ fill: '#3B2F2F', ...NONE }} />
          <path d="M47.5 82.3 Q50 84.3 52.5 82.3" style={{ stroke: '#3B2F2F', strokeWidth: 1.6 }} />
          <path d="M18 92 Q34 84 50 86.5 Q66 84 82 92 Z" style={{ fill: '#D8B894', ...NONE }} />
        </g>
      ) : (
        <g data-anim="bob">
          <path d={tall ? 'M50 43 L50 27' : 'M50 43 L50 35'} />
          {a && <path data-anim="sway-l" d="M50 35 C43 24 32 24 28 30 C33 38 43 39 50 35 Z" fill={a} />}
          {b && <path data-anim="sway-r" d="M50 35 C57 24 68 24 72 30 C67 38 57 39 50 35 Z" fill={b} />}
          {stage === 'bud' && (
            <g data-anim="sway-c">
              <path d="M50 30 C43.5 26 44 16 50 11 C56 16 56.5 26 50 30 Z" fill="#FFD66B" />
              <path d="M44.5 26 Q50 31.5 55.5 26" fill="#86D9AE" />
            </g>
          )}
          {stage === 'bloom' && (
            <g>
              <circle cx="50" cy="10.5" r="6.2" fill="#8FE3BC" />
              <circle cx="58.1" cy="16.4" r="6.2" fill="#8FE3BC" />
              <circle cx="55" cy="25.9" r="6.2" fill="#8FE3BC" />
              <circle cx="45" cy="25.9" r="6.2" fill="#8FE3BC" />
              <circle cx="41.9" cy="16.4" r="6.2" fill="#8FE3BC" />
              <circle cx="50" cy="19" r="5" fill="#FFD66B" />
              <path data-anim="twinkle" d="M16 18 Q16 25 23 25 Q16 25 16 32 Q16 25 9 25 Q16 25 16 18 Z" style={{ fill: '#FFD66B', ...NONE }} />
              <path data-anim="twinkle" d="M84 6 Q84 12 90 12 Q84 12 84 18 Q84 12 78 12 Q84 12 84 6 Z" style={{ fill: '#FFD66B', ...NONE }} />
              <path data-anim="twinkle" d="M89 38 Q89 42.5 93.5 42.5 Q89 42.5 89 47 Q89 42.5 84.5 42.5 Q89 42.5 89 38 Z" style={{ fill: '#9CD2FF', ...NONE }} />
            </g>
          )}
          {hold !== 'resume' && <path d="M30 70 Q22 73 23 80" />}
          {!wave && hold !== 'glass' && <path d="M70 70 Q78 73 77 80" />}
          {wave && (
            <g data-anim="wave">
              <path d="M69 62 Q80 56 81 46" />
              <circle cx="81" cy="44" r="3.6" fill={bodyFill} />
            </g>
          )}
          {hold === 'resume' && (
            <g>
              <path d="M31 66 Q24 64 21 61" />
              <g transform="rotate(-12 13 58)">
                <rect x="4" y="46" width="18" height="23" rx="2.5" fill="#FFFFFF" />
                <path d="M8 52 L18 52 M8 56.5 L18 56.5 M8 61 L14 61" style={{ stroke: '#8CC8FF', strokeWidth: 2 }} />
              </g>
            </g>
          )}
          {hold === 'glass' && <path d="M70 70 Q75 70 76 67" />}
          <circle cx="50" cy="65" r="22" fill={bodyFill} style={{ strokeWidth: 2.6 }} />
          <g data-anim="blink">
            <circle cx="43" cy="63" r="2.8" style={{ fill: '#3B2F2F', ...NONE }} />
            <circle cx="57" cy="63" r="2.8" style={{ fill: '#3B2F2F', ...NONE }} />
            <circle cx="44" cy="62" r="0.9" style={{ fill: '#FFFFFF', ...NONE }} />
            <circle cx="58" cy="62" r="0.9" style={{ fill: '#FFFFFF', ...NONE }} />
          </g>
          <ellipse cx="37" cy="69.5" rx="4" ry="2.5" style={{ fill: '#FFB5B5', ...NONE }} />
          <ellipse cx="63" cy="69.5" rx="4" ry="2.5" style={{ fill: '#FFB5B5', ...NONE }} />
          {worried ? (
            <g>
              <path d="M46.5 72.5 Q50 69.5 53.5 72.5" style={{ stroke: '#3B2F2F', strokeWidth: 2 }} />
              <path d="M38.5 57.5 L45 55.5 M61.5 57.5 L55 55.5" style={{ stroke: '#3B2F2F', strokeWidth: 1.8 }} />
              <path data-anim="drip" d="M71 46 Q74 51 71 53 Q68 51 71 46 Z" style={{ fill: '#9CD2FF', ...NONE }} />
            </g>
          ) : (
            <path d="M46 69.5 Q50 73.5 54 69.5" style={{ stroke: '#3B2F2F', strokeWidth: 2 }} />
          )}
          {hold === 'tag' && (
            <g>
              <rect x="40" y="75" width="20" height="11" rx="2.5" fill="#FFFFFF" style={{ strokeWidth: 1.8 }} />
              <path d="M44 79 L56 79 M44 82.5 L52 82.5" style={{ stroke: '#3DBE8B', strokeWidth: 1.6 }} />
            </g>
          )}
          {hold === 'glass' && (
            <g>
              <path d="M86 70 L93 77" style={{ strokeWidth: 3.4 }} />
              <circle cx="80" cy="63" r="9" fill="#DDF0FF" />
              <path d="M76 60 Q78 57.5 81 57.5" style={{ stroke: '#FFFFFF', strokeWidth: 2 }} />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
