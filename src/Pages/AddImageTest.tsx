import axios from "axios";
import { useState } from "react";

//DE ADAUGAT RESTRICTII PENTRU IMAGINI DUPLICATE SI DIMENSIUNI

function AddImageTest() {
  const [file, setFile] = useState<File | null>(null);
  const [officeId, setOfficeId] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !officeId) {
      alert("Selectează o imagine și introdu ID-ul cabinetului.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("officeId", officeId);

    try {
      await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Imagine încărcată cu succes!");
    } catch (err) {
      console.error(err);
      alert("A apărut o eroare la încărcare.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto" }}>
      <h2>Încarcă imagine pentru cabinet</h2>
      <input
        type="text"
        placeholder="ID Cabinet (office_id)"
        value={officeId}
        onChange={(e) => setOfficeId(e.target.value)}
        className="form-control mb-2"
      />
      <input
        type="file"
        onChange={handleFileChange}
        className="form-control mb-2"
      />
      <button onClick={handleUpload} className="btn btn-primary">
        Încarcă imaginea
      </button>
    </div>
  );
}

export default AddImageTest;
