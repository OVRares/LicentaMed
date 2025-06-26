import React, { useState } from "react";

interface Props {
  value: string;
  onOptionSelect: (selectedOption: string) => void; // Callback to notify parent
  className?: string; // Optional className prop
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
      <option value="DRM">DERMATOLOGIE</option>
      <option value="OFT">OFTALMOLOGIE</option>
      <option value="ORL">ORL</option>
      <option value="PSI">PSIHOLOGIE</option>
      <option value="NEU">NEUROLOGIE</option>
      <option value="PED">PEDIATRIE</option>
      <option value="CRD">CARDIOLOGIE</option>
      <option value="GIN">GINECOLOGIE</option>
    </select>
  );
}

export default SpecPicker;
