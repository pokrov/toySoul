import { type Design, defaultDesign } from "@/lib/design";
export function ToyPortrait({
  config = defaultDesign,
  className = "",
}: {
  config?: Design;
  className?: string;
}) {
  const c = config;
  return (
    <svg
      className={"toy-portrait " + className}
      viewBox="0 0 260 280"
      role="img"
      aria-label={c.name + ", a " + c.archetype}
    >
      <ellipse cx="130" cy="252" rx="80" ry="13" fill="#30263E" opacity=".08" />
      <ellipse cx="130" cy="245" rx="82" ry="14" fill="#F6EFE8" />
      {c.accessory === "wings" && (
        <g fill={c.secondaryColor}>
          <ellipse
            cx="73"
            cy="168"
            rx="27"
            ry="42"
            transform="rotate(-30 73 168)"
          />
          <ellipse
            cx="187"
            cy="168"
            rx="27"
            ry="42"
            transform="rotate(30 187 168)"
          />
        </g>
      )}
      <g fill={c.primaryColor}>
        <ellipse
          cx="130"
          cy="183"
          rx={c.bodyShape === "bean" ? 43 : 54}
          ry={c.bodyShape === "round" ? 49 : 58}
        />
        <ellipse
          cx="84"
          cy="187"
          rx="17"
          ry="32"
          transform="rotate(15 84 187)"
        />
        <ellipse
          cx="176"
          cy="187"
          rx="17"
          ry="32"
          transform="rotate(-15 176 187)"
        />
        <ellipse cx="104" cy="235" rx="23" ry="15" />
        <ellipse cx="156" cy="235" rx="23" ry="15" />
        {c.ears !== "none" && (
          <>
            <ellipse
              cx="89"
              cy={c.ears === "long" ? 55 : 80}
              rx="19"
              ry={c.ears === "long" ? 44 : 24}
              transform="rotate(-12 89 55)"
            />
            <ellipse
              cx="171"
              cy={c.ears === "long" ? 55 : 80}
              rx="19"
              ry={c.ears === "long" ? 44 : 24}
              transform="rotate(12 171 55)"
            />
          </>
        )}
      </g>
      {c.ears !== "none" && (
        <g fill={c.secondaryColor}>
          <ellipse
            cx="88"
            cy={c.ears === "long" ? 52 : 78}
            rx="9"
            ry={c.ears === "long" ? 27 : 13}
            transform="rotate(-12 88 52)"
          />
          <ellipse
            cx="172"
            cy={c.ears === "long" ? 52 : 78}
            rx="9"
            ry={c.ears === "long" ? 27 : 13}
            transform="rotate(12 172 52)"
          />
        </g>
      )}
      {c.pattern === "belly" && (
        <ellipse cx="130" cy="193" rx="30" ry="34" fill={c.secondaryColor} />
      )}
      {c.pattern === "spots" && (
        <g fill={c.secondaryColor}>
          <circle cx="107" cy="178" r="7" />
          <circle cx="142" cy="194" r="9" />
          <circle cx="118" cy="216" r="6" />
        </g>
      )}
      <ellipse cx="130" cy="121" rx="70" ry="61" fill={c.primaryColor} />
      <ellipse cx="110" cy="95" rx="45" ry="23" fill="#FFF" opacity=".10" />
      {c.horns !== "none" && (
        <g fill={c.secondaryColor}>
          <path d="M77 79L86 48L100 70Z" />
          <path d="M160 70L174 48L183 79Z" />
        </g>
      )}
      {c.eyeStyle === "sleepy" || c.eyeStyle === "happy" ? (
        <g
          stroke={c.eyeColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        >
          <path
            d={
              c.eyeStyle === "sleepy" ? "M97 120q8 8 16 0" : "M97 123q8-12 16 0"
            }
          />
          <path
            d={
              c.eyeStyle === "sleepy"
                ? "M147 120q8 8 16 0"
                : "M147 123q8-12 16 0"
            }
          />
        </g>
      ) : (
        <g fill={c.eyeColor}>
          <ellipse cx="105" cy="121" rx="6" ry="9" />
          <ellipse cx="155" cy="121" rx="6" ry="9" />
          <circle cx="103" cy="118" r="2" fill="white" />
          <circle cx="153" cy="118" r="2" fill="white" />
        </g>
      )}
      <g fill="#DF8E9E" opacity=".5">
        <ellipse cx="86" cy="136" rx="10" ry="5" />
        <ellipse cx="174" cy="136" rx="10" ry="5" />
      </g>
      {c.mouthStyle === "smile" ? (
        <path
          d="M123 139q7 9 14 0"
          stroke={c.eyeColor}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <ellipse
          cx="130"
          cy="141"
          rx="3"
          ry={c.mouthStyle === "surprised" ? 5 : 2}
          fill={c.eyeColor}
        />
      )}
      {c.eyebrows && (
        <g stroke={c.eyeColor} strokeWidth="3">
          <path d="M98 105h14" />
          <path d="M148 105h14" />
        </g>
      )}
      {c.accessory === "glasses" && (
        <g stroke="#443C46" strokeWidth="4" fill="none">
          <circle cx="105" cy="121" r="18" />
          <circle cx="155" cy="121" r="18" />
          <path d="M123 121h14" />
        </g>
      )}
      {c.accessory === "moon-necklace" && (
        <g>
          <path
            d="M99 171q31 24 62 0"
            stroke="#CFAB63"
            fill="none"
            strokeWidth="2"
          />
          <path d="M135 184a10 10 0 1 0 5 15a9 9 0 0 1-5-15" fill="#E9C86C" />
        </g>
      )}
      {c.accessory === "scarf" && (
        <path
          d="M87 164q43 20 86 0v13q-12 8-25 9v32h-17v-30q-24 1-44-10Z"
          fill={c.secondaryColor}
        />
      )}
      {c.accessory === "hat" && (
        <g fill={c.secondaryColor}>
          <ellipse cx="130" cy="74" rx="52" ry="9" />
          <path d="M99 71q0-48 31-48t31 48Z" />
        </g>
      )}
      {c.accessory === "helmet" && (
        <ellipse
          cx="130"
          cy="116"
          rx="80"
          ry="78"
          fill="#DFEEFF"
          fillOpacity=".18"
          stroke="white"
          strokeOpacity=".7"
          strokeWidth="3"
        />
      )}
      {c.accessory === "flower" && (
        <g>
          <path d="M179 208v-45" stroke="#668B6C" strokeWidth="3" />
          <circle cx="179" cy="158" r="13" fill="#F0A4B7" />
          <circle cx="179" cy="158" r="5" fill="#E9C86C" />
        </g>
      )}
    </svg>
  );
}
