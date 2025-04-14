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
}: Props) => {
  const [currentIcon, setCurrentIcon] = useState(icon);
  return (
    <button
      className={`btn btn-${color} ${
        variant === "filled"
          ? "btn-filled"
          : variant === "filled-alt"
          ? "btn-filled-alt"
          : "btn-regular"
      } ${selected ? "selected" : ""} ${className || ""}`}
      onClick={onClick}
      onMouseEnter={() => hoverIcon && setCurrentIcon(hoverIcon)}
      onMouseLeave={() => setCurrentIcon(icon)}
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
