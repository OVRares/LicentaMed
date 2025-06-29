import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "../App.css";
import axios from "axios";
import Button from "../components/Button";
import placeholder from "../assets/placeholder.png";
import { StreamChat } from "stream-chat";

function DoctorAbout() {
  const [image, setImage] = useState<File | null>(null);
  const [user, setUser] = useState<null | {
    uid: string;
    email: string;
    role: string;
    name: string;
  }>(null);
  const [loading, setLoading] = useState(true);
  const didCallEndpoint = useRef(false);
  const [aboutData, setAboutData] = useState<any>(null);
  const [editedAboutText, setEditedAboutText] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const { doctorId } = useParams();
  const isVisitor = Boolean(doctorId);
  const isRegularUser = user?.role === "reg";
  const isDoctor = user?.role !== "reg" && !isVisitor;

  const [officeName, setOfficeName] = useState("");
  const [officeCounty, setOfficeCounty] = useState("");
  const [officeCity, setOfficeCity] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");

  const [editedOfficeText, setEditedOfficeText] = useState("");

  const [services, setServices] = useState(
    Array.from({ length: 12 }, () => ({ name: "", price: "" }))
  );

  const [modalImage, setModalImage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const isOnAboutPage = location.pathname === "/about";

  const [newGalleryImages, setNewGalleryImages] = useState<File[]>([]);

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewGalleryImages([...newGalleryImages, ...Array.from(e.target.files)]);
    }
  };

  const openInGoogleMaps = () => {
    const fullAddress = `${aboutData?.adresa}, ${aboutData?.oras}, ${aboutData?.judet}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapsUrl, "_blank");
  };

  const handleLogout = async (): Promise<void> => {
    try {
      const client = StreamChat.getInstance("vs9hb5583yhf");

      if (client.userID) {
        await client.disconnectUser();
        console.log("Disconnected from StreamChat");
      }

      await axios.post(
        "http://localhost:5000/logout",
        {},
        { withCredentials: true }
      );
      client?.disconnectUser;
      localStorage.removeItem("userRole");
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      if (image) {
        const formData = new FormData();
        formData.append("image", image);
        formData.append("doctorId", user.uid);

        const uploadRes = await axios.post(
          "http://localhost:5000/uploadProfilePicture",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          }
        );

        console.log(" Profile image uploaded:", uploadRes.data.filename);
      }

      if (newGalleryImages.length > 0) {
        const galleryForm = new FormData();
        newGalleryImages.forEach((img) => galleryForm.append("images", img));
        galleryForm.append("doctorId", user.uid);

        await axios.post(
          "http://localhost:5000/about/uploadGalleryImages",
          galleryForm,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          }
        );

        console.log(" Gallery images uploaded");
      }

      await axios.post(
        "http://localhost:5000/about/updateProfile",
        {
          uid: user.uid,
          bio: editedBio,
          about_text: editedAboutText,
          about_text_office: editedOfficeText,
        },
        { withCredentials: true }
      );

      if (services.length > 0) {
        await axios.post(
          "http://localhost:5000/about/saveServices",
          {
            uid: user.uid,
            services,
          },
          { withCredentials: true }
        );
        console.log("✅ Services saved");
      }

      await axios.post(
        "http://localhost:5000/about/updateOfficeDetails",
        {
          uid: user.uid,
          nume: officeName,
          judet: officeCounty,
          oras: officeCity,
          adresa: officeAddress,
        },
        { withCredentials: true }
      );

      setAboutData((prev: any) => ({
        ...prev,
        bio: editedBio,
        about_text: editedAboutText,
        about_text_office: editedOfficeText,
        profile_picture: image ? image.name : prev?.profile_picture,
        office_nume: officeName,
        judet: officeCounty,
        oras: officeCity,
        adresa: officeAddress,
      }));

      setNewGalleryImages([]);
      setIsEditing(false);
      alert("Profile saved!");
    } catch (err) {
      console.error(" Save error:", err);
      alert("Could not save profile.");
    }
  };

  const handleDeleteGalleryImage = async (imageUrl: string) => {
    if (!user) return;
    try {
      await axios.post(
        "http://localhost:5000/about/deleteGalleryImage",
        {
          doctorId: user.uid,
          imageUrl,
        },
        { withCredentials: true }
      );
      setGalleryImages((prev) => prev.filter((img) => img !== imageUrl));
    } catch (err) {
      console.error("Failed to delete image:", err);
      alert("Could not delete image.");
    }
  };

  const handleStartChat = async () => {
    const token = localStorage.getItem("streamToken");
    const streamUser = JSON.parse(localStorage.getItem("streamUser") || "{}");

    if (!token || !streamUser.id || !doctorId || !aboutData) {
      alert("Eroare: utilizatorul nu este autentificat sau date lipsă.");
      return;
    }

    const client = StreamChat.getInstance("vs9hb5583yhf");

    if (!client.userID) {
      await client.connectUser(streamUser, token);
    }

    const channelId = `chat-${streamUser.id}-${doctorId}`;

    const channel = client.channel("messaging", channelId, {
      members: [streamUser.id, doctorId],
      name: `Conversație Dr. ${aboutData.doctor_nume || "Doctor"} - ${
        streamUser.name || "Utilizator"
      }`,
    });

    try {
      await channel.watch();
      navigate(`/rsplitchats?channelId=${channelId}`);
    } catch (error: any) {
      if (error.code !== 16) {
        console.error("Eroare la creare canal:", error);
      } else {
        navigate(`/chat/${channelId}`);
      }
    }
  };

  useEffect(() => {
    if (didCallEndpoint.current) return;
    didCallEndpoint.current = true;

    const fetchAllData = async () => {
      try {
        const sessionRes = await axios.get("http://localhost:5000/session", {
          withCredentials: true,
        });
        const currentUser = sessionRes.data.user || null;
        setUser(currentUser);

        if (currentUser && currentUser.role !== "reg" && doctorId) {
          navigate("/about");
          return;
        }

        const targetDoctorId = doctorId || currentUser?.uid;
        if (!targetDoctorId) return;

        const aboutRes = await axios.get(
          `http://localhost:5000/about/doctorOffice/${targetDoctorId}`,
          { withCredentials: true }
        );
        setAboutData(aboutRes.data || {});
        setEditedBio(aboutRes.data.bio || "");
        setEditedAboutText(aboutRes.data.about_text || "");
        setEditedOfficeText(aboutRes.data.about_text_office || "");
        setOfficeName(aboutRes.data.office_nume || "");
        setOfficeCounty(aboutRes.data.judet || "");
        setOfficeCity(aboutRes.data.oras || "");
        setOfficeAddress(aboutRes.data.adresa || "");

        const galleryRes = await axios.get(
          `http://localhost:5000/about/galleryImages/${targetDoctorId}`,
          { withCredentials: true }
        );
        setGalleryImages(galleryRes.data.map((img: any) => img.image_url));

        const servicesRes = await axios.get(
          `http://localhost:5000/about/fetchServices/${targetDoctorId}`,
          { withCredentials: true }
        );
        const paddedServices = Array.from({ length: 12 }, (_, i) => {
          const match = servicesRes.data.find(
            (s: any) => s.slot_number === i + 1
          );
          return match
            ? {
                name: match.service_name,
                price: match.service_price.toString(),
              }
            : { name: "", price: "" };
        });
        setServices(paddedServices);
      } catch (err) {
        console.error(" Data fetch failed:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <header className="header">
        <div className="header-left">
          <img
            src="src/assets/Minerva2.png"
            alt="Company Logo"
            className="logo"
          />
        </div>

        <div className="header-center">
          <Button
            width="80px"
            variant="filled-alt"
            color="blue"
            onClick={() => navigate("/main2")}
            selected={location.pathname === "/main2"}
          >
            Home
          </Button>
          <Button
            color="blue"
            variant="filled-alt"
            onClick={() => navigate("/appointments_doc")}
          >
            Appointments
          </Button>
          <Button
            width="80px"
            color="blue"
            variant="filled-alt"
            onClick={() => navigate("/splitchats")}
          >
            Chat
          </Button>
          <Button
            width="110px"
            color="blue"
            variant="filled-alt"
            onClick={() => navigate("/testscheduler")}
          >
            Scheduler
          </Button>
        </div>

        <div className="header-right">
          {user && user.role !== "reg" && (
            <button
              className={`round-button ${isOnAboutPage ? "active" : ""}`}
              onClick={() => navigate("/about")}
              title="Profile"
            >
              <img
                src="src/assets/user.png"
                alt=""
                className="round-button-icon"
              />
            </button>
          )}

          <Button
            color="blue"
            variant="filled-alt"
            width="80px"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </header>

      <div className="about-container">
        <div className="about-card">
          <div className="about-content">
            <div
              className={`about-image-section ${
                (image || aboutData?.profile_picture) &&
                aboutData?.profile_picture !== "placeholder.png"
                  ? "no-border"
                  : ""
              }`}
            >
              <div
                className={`profile-image-wrapper ${
                  (!image && !aboutData?.profile_picture) ||
                  aboutData?.profile_picture === "placeholder.png"
                    ? "with-upload-box"
                    : ""
                }`}
              >
                <img
                  src={
                    image
                      ? URL.createObjectURL(image)
                      : aboutData?.profile_picture
                      ? `http://localhost:5000/uploads/${aboutData.profile_picture}`
                      : placeholder
                  }
                  alt="Doctor"
                  className="doctor-image"
                />

                {isEditing && (
                  <>
                    <label className="profile-image-overlay center-plus">
                      +
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="image-input"
                      />
                    </label>

                    {(image || aboutData?.profile_picture) && (
                      <button
                        className="profile-image-overlay top-right-x"
                        onClick={() => {
                          setImage(null);
                          setAboutData((prev: any) => ({
                            ...prev,
                            profile_picture: "",
                          }));
                        }}
                      >
                        ×
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="about-text-section">
              <div className="doctor-header-row">
                <div className="doctor-col">
                  <h1 className="doctor-name">
                    {aboutData?.doctor_nume || aboutData?.nume
                      ? `Dr. ${aboutData?.doctor_nume || ""} ${
                          aboutData?.doctor_prenume || aboutData?.nume
                        }`
                      : "Doctor"}
                  </h1>

                  {!isEditing ? (
                    <p className="doctor-bio">
                      <strong>{aboutData?.bio || "Specialty not set"}</strong>
                    </p>
                  ) : (
                    <input
                      type="text"
                      className="doctor-bio-input"
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      placeholder="Enter your specialty"
                    />
                  )}
                </div>

                {!isEditing && (
                  <div className="office-col">
                    {officeName && (
                      <p className="doctor-office-name">{officeName}</p>
                    )}
                    {isDoctor && aboutData?.office_id && (
                      <p className="doctor-office-id">
                        <strong>Cod Cabinet:</strong> {aboutData.office_id}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {!isEditing ? (
                <>
                  <p className="doctor-address">
                    <strong>Adresă:</strong>{" "}
                    {aboutData
                      ? `${
                          aboutData.adresa
                        }, ${aboutData.oras?.toUpperCase()}, ${
                          aboutData.judet
                        } -`
                      : "Address not available"}
                    {aboutData?.adresa && (
                      <span
                        className="open-map-link"
                        onClick={() => {
                          const full = `${aboutData.adresa}, ${aboutData.oras}, ${aboutData.judet}`;
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              full
                            )}`,
                            "_blank"
                          );
                        }}
                      >
                        {" "}
                        Locație pe hartă
                      </span>
                    )}
                  </p>

                  {isRegularUser && (
                    <div className="about-card-fab">
                      <Button
                        width="120px"
                        color="blue"
                        onClick={handleStartChat}
                      >
                        Chat
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="office-edit-grid">
                  <div className="office-input-group full-width">
                    <label className="office-label">Office Name:</label>
                    <input
                      type="text"
                      value={officeName}
                      onChange={(e) => setOfficeName(e.target.value)}
                      className="office-input"
                    />
                  </div>

                  <div className="office-input-group">
                    <label className="office-label">Judet:</label>
                    <select
                      value={officeCounty}
                      onChange={(e) => setOfficeCounty(e.target.value)}
                      className="office-input"
                    >
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
                      <option value="Cluj">Cluj</option>
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
                      <option value="Satu Mare">Satu Mare</option>
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
                  </div>

                  <div className="office-input-group">
                    <label className="office-label">Oras:</label>
                    <input
                      type="text"
                      value={officeCity}
                      onChange={(e) => setOfficeCity(e.target.value)}
                      className="office-input"
                    />
                  </div>

                  <div className="office-input-group full-width">
                    <label className="office-label">Adresă:</label>
                    <input
                      type="text"
                      value={officeAddress}
                      onChange={(e) => setOfficeAddress(e.target.value)}
                      className="office-input"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="about-info-container">
          <h1 className="doctor-name">
            {aboutData?.doctor_nume || aboutData?.nume
              ? `Dr. ${aboutData?.doctor_nume || ""} ${
                  aboutData?.doctor_prenume || aboutData?.nume
                }`
              : "Doctor"}
          </h1>

          {isEditing ? (
            <textarea
              className="about-textarea"
              value={editedAboutText}
              onChange={(e) => setEditedAboutText(e.target.value)}
              placeholder="Write something about yourself..."
              rows={7}
            />
          ) : (
            <p className="about-section-content">
              {aboutData?.about_text ||
                "No additional information provided yet."}
            </p>
          )}
        </div>

        <div className="doctor-gallery-container">
          <h2 className="gallery-heading">Galerie</h2>

          <div className="gallery-card">
            <div className="image-grid">
              {galleryImages.map((imgUrl, index) => (
                <div className="image-wrapper" key={`saved-${index}`}>
                  <img
                    src={`http://localhost:5000/uploads/${imgUrl}`}
                    alt={`Gallery ${index}`}
                    className="gallery-image"
                    onClick={() =>
                      !isEditing &&
                      setModalImage(`http://localhost:5000/uploads/${imgUrl}`)
                    }
                  />
                  {isEditing && (
                    <button
                      className="gallery-delete-button"
                      onClick={() => handleDeleteGalleryImage(imgUrl)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {newGalleryImages.map((img, index) => (
                <div className="image-wrapper" key={`new-${index}`}>
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`New Gallery ${index}`}
                    className="gallery-image"
                    onClick={() =>
                      !isEditing && setModalImage(URL.createObjectURL(img))
                    }
                  />
                </div>
              ))}

              {isEditing && (
                <label className="image-upload-box">
                  +
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    className="image-input"
                  />
                </label>
              )}
            </div>
          </div>

          {modalImage && (
            <div className="modal-overlay" onClick={() => setModalImage(null)}>
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="modal-close"
                  onClick={() => setModalImage(null)}
                >
                  ×
                </button>
                <img src={modalImage} alt="Enlarged" className="modal-image" />
              </div>
            </div>
          )}
        </div>

        <div className="services-section">
          <h2 className="services-heading">Servicii Standard Disponibile</h2>
          <div className="services-grid">
            {services.map((service, index) => (
              <div className="service-slot" key={index}>
                {!isEditing ? (
                  <div className="service-readonly">
                    <span className="service-name">
                      {service.name || "\u00A0"}
                    </span>
                    <span className="service-price">
                      {service.price ? `${service.price} LEI` : "\u00A0"}
                    </span>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      className="service-name-input"
                      placeholder="Service Name"
                      value={service.name}
                      onChange={(e) => {
                        const updated = [...services];
                        updated[index].name = e.target.value;
                        setServices(updated);
                      }}
                    />
                    <div className="price-wrapper">
                      <input
                        type="text"
                        className="price-input"
                        placeholder="Price"
                        value={service.price}
                        onChange={(e) => {
                          const updated = [...services];
                          updated[index].price = e.target.value;
                          setServices(updated);
                        }}
                      />
                      <span className="price-currency">LEI</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="about-info-container">
          <h2 className="about-section-heading">
            Despre {aboutData?.office_nume || "the Office"}
          </h2>
          {isEditing ? (
            <textarea
              className="about-textarea"
              value={editedOfficeText}
              onChange={(e) => setEditedOfficeText(e.target.value)}
              placeholder="Write something about the office..."
              rows={7}
            />
          ) : (
            <p className="about-section-content">
              {aboutData?.about_text_office ||
                "No additional office information provided yet."}
            </p>
          )}
        </div>
        {isDoctor && (
          <div className="save-button-container">
            {!isEditing ? (
              <Button
                color="blue"
                variant="filled"
                width="100px"
                onClick={() => {
                  setIsEditing(true);
                  setEditedAboutText(aboutData?.about_text || "");
                  setEditedBio(aboutData?.bio || "");
                }}
              >
                Edit
              </Button>
            ) : (
              <>
                <Button
                  color="blue"
                  variant="filled"
                  width="100px"
                  onClick={handleSave}
                >
                  Save
                </Button>
                <Button
                  color="gray"
                  variant="regular"
                  width="100px"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default DoctorAbout;
