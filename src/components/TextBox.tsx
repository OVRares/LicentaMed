import React from "react";

interface Props {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  className?: string;
  type?: "text" | "password" | "email" | "number";
  style?: React.CSSProperties;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

const TextBox = ({
  value,
  onChange,
  placeholder = "Enter text",
  className = "",
  type = "text",
  onKeyDown,
}: Props) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      className={`form-control ${className}`}
    />
  );
};

export default TextBox;
