import { useState, useEffect } from "react";

interface Props {
  onDateChange: (age: number) => void;
}

const DateOfBirthPicker = ({ onDateChange }: Props) => {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const months = [
    "IAN",
    "FEB",
    "MAR",
    "APR",
    "MAI",
    "IUN",
    "IUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const monthIndex = month ? months.indexOf(month) : -1;

  const years = Array.from({ length: 100 }, (_, i) =>
    (new Date().getFullYear() - i).toString()
  );

  function getDaysInMonth(month: number, year: string): number {
    const numericYear = parseInt(year, 10);
    if (month < 0 || isNaN(numericYear)) return 31;
    return new Date(numericYear, month + 1, 0).getDate();
  }

  const maxDays = getDaysInMonth(monthIndex, year);
  const days = Array.from({ length: maxDays }, (_, i) => (i + 1).toString());

  useEffect(() => {
    if (day && month && year) {
      const birthDate = new Date(
        parseInt(year),
        months.indexOf(month),
        parseInt(day)
      );
      const today = new Date();

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();

      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      onDateChange(age);
    }
  }, [day, month, year]);

  return (
    <div className="dob-picker-container">
      <select
        className="form-select"
        value={day}
        onChange={(e) => setDay(e.target.value)}
        style={{ color: day ? "black" : "#6c757d" }} // ✅ Dynamically change color
      >
        <option value="" disabled>
          Zi
        </option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        className="form-select"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        style={{ color: month ? "black" : "#6c757d" }}
      >
        <option value="" disabled>
          Luna
        </option>
        {months.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        className="form-select"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        style={{ color: year ? "black" : "#6c757d" }}
      >
        <option value="" disabled>
          An
        </option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DateOfBirthPicker;
