import React from "react";
import { useState } from "react";

interface Props {
  children?: string;
  color?: "primary" | "secondary" | "danger" | "cyan" | "gray" | "blue";
  onClick: () => void;
  selected?: boolean;
  icon?: string;
  hoverIcon?: string;
  variant?: "filled" | "regular" | "filled-alt";
  type?: "button" | "submit" | "reset";
  className?: string;
  width?: string;
  height?: string;
  disabled?: boolean;
}

const Button = ({
  children,
  onClick,
  color = "primary",
  selected = false,
  icon,
  hoverIcon,
  variant = "regular",
  type = "button",
  className,
  width,
  height,
  disabled = false, // ✅ Add default
}: Props) => {
  const [currentIcon, setCurrentIcon] = useState(icon);

  const inlineStyle: React.CSSProperties = {
    width,
    height,
  };

  const variantClass =
    variant === "filled"
      ? "btn-filled"
      : variant === "filled-alt"
      ? "btn-filled-alt"
      : "btn-regular";

  const colorClass = variant === "filled-alt" ? "" : `btn-${color}`;

  return (
    <button
      className={`btn ${colorClass} ${variantClass} ${
        selected ? "selected" : ""
      } ${className || ""}`}
      type={type}
      onClick={onClick}
      disabled={disabled} // ✅ Pass prop to native button
      onMouseEnter={() => hoverIcon && setCurrentIcon(hoverIcon)}
      onMouseLeave={() => setCurrentIcon(icon)}
      style={inlineStyle}
    >
      {icon && (
        <img
          src={currentIcon}
          alt="icon"
          className="button-icon"
          data-default={icon}
          data-hover={hoverIcon}
        />
      )}
      <span>{children}</span>
    </button>
  );
};

export default Button;
