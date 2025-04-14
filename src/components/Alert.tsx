import { ReactNode } from "react";

interface Props {
  message: string;
  className?: string;
}

const Alert = ({ message }: Props) => {
  if (!message) return null; // Don't render if there's no message

  return <div className="alert alert-danger  ${className}">{message}</div>;
};

export default Alert;
