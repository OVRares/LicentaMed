import React, { useState } from "react";

interface Props {
  value: string;
  onOptionSelect: (selectedOption: string) => void; // Callback to notify parent
}

function SpecPicker({ value, onOptionSelect }: Props) {
  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selected = event.target.value;
    onOptionSelect(selected);
  }

  return (
    <select
      id="spec-options"
      value={value}
      onChange={handleChange}
      className="form-select"
      style={{ color: value ? "black" : "#6c757d" }} // ✅ Dynamically change color
    >
      <option value="" disabled>
        Specializare
      </option>
      <option value="KIN">KINETOTERAPIE</option>
      <option value="FAM">MEDICINA DE FAMILIE</option>
      <option value="DEN">MEDICINA DENTARA</option>
    </select>
  );
}

export default SpecPicker;
