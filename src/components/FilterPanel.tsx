import JudetPicker from "./JudetPicker";
import SpecPicker from "./SpecPicker";
import Button from "./Button";

interface Props {
  onJudetChange: (judet: string) => void;
  onSpecialtyChange: (spec: string) => void;
  onResetFilters: () => void;
  judet: string;
  spec: string;
}

const FilterPanel = ({
  onJudetChange,
  onSpecialtyChange,
  onResetFilters,
  judet,
  spec,
}: Props) => {
  return (
    <div className="filter-panel">
      <h5 className="filter-title">Filtre</h5>

      <div className="mb-3">
        <JudetPicker value={judet} onOptionSelect={onJudetChange} />
      </div>

      <div className="mb-3">
        <SpecPicker value={spec} onOptionSelect={onSpecialtyChange} />
      </div>

      <div className="filter-reset">
        <Button onClick={onResetFilters} variant="regular">
          Resetează filtrele
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;
