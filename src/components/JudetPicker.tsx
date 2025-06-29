import React, { useState } from "react";

interface Props {
  value: string;
  onOptionSelect: (selectedOption: string) => void;
  className?: string;
}

function JudetPicker({ value, onOptionSelect }: Props) {
  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selected = event.target.value;
    onOptionSelect(selected);
  }

  return (
    <select
      id="judet-options"
      value={value}
      onChange={handleChange}
      className="form-select"
      style={{ color: value ? "black" : "#6c757d" }}
    >
      <option value="" disabled>
        Judet
      </option>
      <option value="Alba">Alba</option>
      <option value="Arad">Arad</option>
      <option value="Arges">Argeş</option>
      <option value="Bacau">Bacău</option>
      <option value="Bihor">Bihor</option>
      <option value="Bistria-Nasaud">Bistriţa</option>
      <option value="Botosani">Botoşani</option>
      <option value="Brasov">Braşov</option>
      <option value="Braila">Brăila</option>
      <option value="Bucuresti">București</option>
      <option value="Buzău">Buzău</option>
      <option value="Caras-Severin">Severin</option>
      <option value="Calarasi">Călăraşi</option>
      <option value="Cluj"> Cluj</option>
      <option value="Constanta">Constanţa</option>
      <option value="Covasna">Covasna</option>
      <option value="Dambovita">Dâmboviţa</option>
      <option value="Dolj">Dolj</option>
      <option value="Galati">Galaţi</option>
      <option value="Giurgiu">Giurgiu</option>
      <option value="Gorj">Gorj</option>
      <option value="Harghita">Harghita</option>
      <option value="Hunedoara">Hunedoara</option>
      <option value="Ialomita">Ialomiţa</option>
      <option value="Iasi">Iaşi</option>
      <option value="Ilfov">Ilfov</option>
      <option value="Maramures">Maramureş</option>
      <option value="Mehedinti">Mehedinţi</option>
      <option value="Mures">Mureş</option>
      <option value="Neamt">Neamţ</option>
      <option value="Olt">Olt</option>
      <option value="Prahova">Prahova</option>
      <option value="Satu Mare">Satu</option>
      <option value="Salaj">Sălaj</option>
      <option value="Sibiu">Sibiu</option>
      <option value="Suceava">Suceava</option>
      <option value="Teleorman">Teleorman</option>
      <option value="Timis">Timiş</option>
      <option value="Tulcea">Tulcea</option>
      <option value="Vaslui">Vaslui</option>
      <option value="Valcea">Vâlcea</option>
      <option value="Vrancea">Vrancea</option>
    </select>
  );
}

export default JudetPicker;
