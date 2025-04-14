import React from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  redirectTo: string;
  className?: string;
}

const ClickLink = ({ redirectTo, className = "" }: Props) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(redirectTo); // Redirect to the specified URL
  };

  return (
    <p
      onClick={handleClick}
      className={`text-primary cursor-pointer ${className}`}
      style={{ textDecoration: "underline" }}
    >
      Nu aveti un cont? Inregistrati-va aici!
    </p>
  );
};

export default ClickLink;
