/** Material Symbols (rounded) icon. Names come from the Material Symbols set. */

interface IconProps {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
  "aria-hidden"?: boolean;
}

export default function Icon({ name, size, fill, className, ...rest }: IconProps) {
  const style: React.CSSProperties = {};
  if (size) style.fontSize = `${size}px`;
  if (fill) style.fontVariationSettings = '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24';
  return (
    <span
      className={`material-symbols-rounded${className ? ` ${className}` : ""}`}
      style={style}
      aria-hidden={rest["aria-hidden"] ?? true}
    >
      {name}
    </span>
  );
}
