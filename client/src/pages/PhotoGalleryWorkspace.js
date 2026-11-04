import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./PhotoGalleryWorkspace.css";

const API_ORIGIN = process.env.REACT_APP_API_URL || "http://localhost:5000";

function mapServerPhoto(photo) {
  const filepath = photo.filepath || "";
  return {
    id: Number(photo.id),
    title: photo.title || "Untitled photo",
    description: photo.description || "",
    image: filepath.startsWith("http") ? filepath : `${API_ORIGIN}${filepath}`,
    filepath,
    filename: photo.filename || "",
    tags: photo.tags || "",
    albumId: photo.album_id == null ? null : Number(photo.album_id),
    uploadDate: photo.upload_date || photo.uploadDate || new Date().toISOString(),
  };
}

function mapServerAlbum(album) {
  return {
    id: Number(album.id),
    title: album.title || "Untitled album",
    description: album.description || "",
  };
}

function PhotoCard({ photo, albums, onView, onEdit, onDelete }) {
  const album = albums.find((item) => item.id === photo.albumId);
  return (
    <article className="pg-photo-card">
      <div className="pg-photo-image-wrap">
        <img src={photo.image} alt={photo.title} className="pg-photo-image" />
        <span className="pg-photo-date">
          {photo.uploadDate ? new Date(photo.uploadDate).toLocaleDateString() : "Recently added"}
        </span>
      </div>
      <div className="pg-photo-content">
        <div className="pg-photo-title-row">
          <h3>{photo.title}</h3>
          {album && <span className="pg-album-chip">{album.title}</span>}
        </div>
        <p>{photo.description || "No description added."}</p>
        {photo.tags && (
          <div className="pg-tag-list">
            {photo.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
              <span className="pg-tag" key={`${photo.id}-${tag}`}>#{tag}</span>
            ))}
          </div>
        )}
        <div className="pg-photo-actions">
          <button type="button" className="pg-btn pg-btn-light" onClick={() => onView(photo)}>View</button>
          <button type="button" className="pg-btn pg-btn-outline" onClick={() => onEdit(photo)}>Edit</button>
          <button type="button" className="pg-btn pg-btn-dark" onClick={() => onDelete(photo.id)}>Delete</button>
        </div>
      </div>
    </article>
  );
}

function PhotoGalleryWorkspace({ currentUser, onProfileUpdate }) {
  const storageUserKey = String(currentUser?.id || currentUser?.email || "demo-user").replace(/[^a-z0-9_-]/gi, "_");
  const profileStorageKey = `photoGalleryProfile_${storageUserKey}`;
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [galleryQuery, setGalleryQuery] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [searchMode, setSearchMode] = useState("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");
  const [profile, setProfile] = useState(() => ({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    bio: currentUser?.bio || "",
  }));
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState(profile);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() {
      try {
        setPhotosLoading(true);
        const response = await api.get("/api/photos");
        if (!cancelled) {
          setPhotos((response.data.photos || []).map(mapServerPhoto));
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(error.response?.data?.message || "Could not load photos from the server.");
        }
      } finally {
        if (!cancelled) setPhotosLoading(false);
      }
    }

    loadPhotos();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadAlbums() {
      try {
        setAlbumsLoading(true);
        const response = await api.get("/api/albums");
        if (!cancelled) {
          setAlbums((response.data.albums || []).map(mapServerAlbum));
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(error.response?.data?.message || "Could not load albums from the server.");
        }
      } finally {
        if (!cancelled) setAlbumsLoading(false);
      }
    }

    loadAlbums();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setProfileLoading(true);
        const response = await api.get("/api/auth/me");
        const user = response.data.user || {};
        const serverProfile = {
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          bio: user.bio || "",
        };

        if (!cancelled) {
          setProfile(serverProfile);
          setProfileDraft(serverProfile);
          localStorage.setItem(profileStorageKey, JSON.stringify(serverProfile));
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(error.response?.data?.message || "Could not load your profile from the server.");
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, [currentUser?.id, profileStorageKey]);

  const galleryPhotos = useMemo(() => photos.filter((photo) =>
    photo.title.toLowerCase().includes(galleryQuery.toLowerCase().trim())
  ), [photos, galleryQuery]);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setNotice("Please choose a JPG, PNG, GIF or WEBP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice("The image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile(file);
      setPreview(String(reader.result || ""));
      setNotice("");
    };
    reader.onerror = () => setNotice("The selected image could not be previewed.");
    reader.readAsDataURL(file);
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!selectedFile || !preview) {
      setNotice("Please choose a photo first.");
      return;
    }
    if (!title.trim()) {
      setNotice("Please enter a photo title.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", selectedFile);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("tags", tags.split(",").map((tag) => tag.trim()).filter(Boolean).join(","));
    if (selectedAlbumId) formData.append("album_id", selectedAlbumId);

    try {
      setUploading(true);
      const response = await api.post("/api/photos/upload", formData);
      const savedPhoto = mapServerPhoto({
        ...response.data.photo,
        upload_date: new Date().toISOString(),
      });
      setPhotos((existing) => [savedPhoto, ...existing]);
      setSelectedFile(null);
      setPreview("");
      setTitle("");
      setDescription("");
      setTags("");
      setSelectedAlbumId("");
      event.target.reset();
      setNotice(response.data.message || "Photo uploaded successfully.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeletePhoto(id) {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    try {
      await api.delete(`/api/photos/${id}`);
      setPhotos((existing) => existing.filter((photo) => photo.id !== id));
      if (selectedPhoto?.id === id) setSelectedPhoto(null);
      if (editingPhoto?.id === id) setEditingPhoto(null);
      setNotice("Photo deleted successfully.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not delete this photo.");
    }
  }

  async function handleSavePhotoEdit() {
    if (!editingPhoto?.title?.trim()) {
      setNotice("Photo title cannot be empty.");
      return;
    }
    try {
      await api.put(`/api/photos/${editingPhoto.id}`, {
        title: editingPhoto.title.trim(),
        description: (editingPhoto.description || "").trim(),
        tags: (editingPhoto.tags || "").trim(),
        album_id: editingPhoto.albumId || null,
      });
      setPhotos((existing) => existing.map((photo) =>
        photo.id === editingPhoto.id
          ? { ...photo, ...editingPhoto, title: editingPhoto.title.trim() }
          : photo
      ));
      setEditingPhoto(null);
      setNotice("Photo details updated successfully.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not update photo details.");
    }
  }

  async function handleCreateAlbum(event) {
    event.preventDefault();
    if (!newAlbumTitle.trim()) {
      setNotice("Enter an album name.");
      return;
    }
    const duplicate = albums.some((album) => album.title.toLowerCase() === newAlbumTitle.trim().toLowerCase());
    if (duplicate) {
      setNotice("An album with this name already exists.");
      return;
    }
    try {
      await api.post("/api/albums", {
        title: newAlbumTitle.trim(),
        description: newAlbumDescription.trim(),
      });
      const response = await api.get("/api/albums");
      setAlbums((response.data.albums || []).map(mapServerAlbum));
      setNewAlbumTitle("");
      setNewAlbumDescription("");
      setNotice("Album created successfully.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not create album.");
    }
  }

  async function handleDeleteAlbum(albumId) {
    if (!window.confirm("Delete this album? Its photos will remain in your gallery without an album.")) return;
    try {
      await api.delete(`/api/albums/${albumId}`);
      setAlbums((existing) => existing.filter((album) => album.id !== albumId));
      setPhotos((existing) => existing.map((photo) => photo.albumId === albumId ? { ...photo, albumId: null } : photo));
      setNotice("Album deleted. Its photos remain in your gallery.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not delete this album.");
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    const updatedProfile = {
      name: profileDraft.name.trim(),
      email: profileDraft.email.trim().toLowerCase(),
      phone: (profileDraft.phone || "").trim(),
      bio: (profileDraft.bio || "").trim(),
    };

    if (!updatedProfile.name || !updatedProfile.email) {
      setNotice("Name and email are required.");
      return;
    }

    try {
      setProfileSaving(true);
      const response = await api.put("/api/users/profile", updatedProfile);

      setProfile(updatedProfile);
      setProfileDraft(updatedProfile);
      localStorage.setItem(profileStorageKey, JSON.stringify(updatedProfile));
      if (onProfileUpdate) onProfileUpdate(updatedProfile);
      setEditingProfile(false);
      setNotice(response.data.message || "Profile updated successfully.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not update your profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  }


async function handleSearch() {
  if (searchMode !== "date" && !searchQuery.trim()) {
    setNotice("Please enter something to search.");
    return;
  }

  if (searchMode === "date" && !dateFrom && !dateTo) {
    setNotice("Please select at least one date.");
    return;
  }

  if (dateFrom && dateTo && dateFrom > dateTo) {
    setNotice("The starting date cannot be after the ending date.");
    return;
  }

  const params = { mode: searchMode };

  if (searchMode === "name" || searchMode === "tag") {
    params.q = searchQuery.trim();
  }

  if (searchMode === "date") {
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
  }

  try {
    setSearchLoading(true);
    setHasSearched(true);

    const response = await api.get("/api/search", { params });

    setSearchResults(
      (response.data.photos || []).map(mapServerPhoto)
    );

    setNotice(response.data.count + " matching photos found.");

    document
      .getElementById("pg-search-results")
      ?.scrollIntoView({ behavior: "smooth" });

  } catch (error) {
    setSearchResults([]);
    setNotice(
      error.response?.data?.message ||
      "Photo search failed. Please try again."
    );
  } finally {
    setSearchLoading(false);
  }
}


  function resetSearch() {
  setSearchQuery("");
  setDateFrom("");
  setDateTo("");
  setSearchMode("name");
  setSearchResults([]);
  setHasSearched(false);
  setNotice("");
  }

  return (
    <div className="pg-workspace">
      <nav className="pg-section-nav">
        <a href="#pg-home">Home</a>
        <a href="#pg-upload">Upload Photo</a>
        <a href="#pg-gallery">My Gallery</a>
        <a href="#pg-search">Search Photos</a>
        <a href="#pg-albums">Albums</a>
        <a href="#pg-settings">Settings</a>
      </nav>

      <section className="pg-hero" id="pg-home">
        <div className="pg-hero-copy">
          <span className="pg-eyebrow">YOUR PERSONAL PHOTO SPACE</span>
          <h1>Save your moments.<br />Show your story.</h1>
          <p>Keep your favourite photos organised, searchable and easy to revisit.</p>
          <a className="pg-primary-link" href="#pg-upload">Upload a photo <span aria-hidden="true">→</span></a>
        </div>
        <div className="pg-hero-art">
          <div className="pg-art-frame pg-art-one"><img src="/images/nature.jpg" alt="Nature sample" /></div>
          <div className="pg-art-frame pg-art-two"><img src="/images/convocation.jpg" alt="Event sample" /></div>
          <div className="pg-art-caption"><strong>Moments worth keeping</strong><span>One gallery for your memories</span></div>
        </div>
      </section>

      {notice && <div className="pg-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}

      <section className="pg-section" id="pg-upload">
        <div className="pg-section-heading">
          <span className="pg-eyebrow">ADD TO YOUR COLLECTION</span>
          <h2>Upload a new photo</h2>
          <p>Choose an image, preview it and add details before saving it to your gallery.</p>
        </div>
        <form className="pg-upload-card" onSubmit={handleUpload}>
          <div className="pg-drop-area">
            {preview ? <img className="pg-upload-preview" src={preview} alt="Selected photo preview" /> : (
              <div className="pg-drop-placeholder"><span>↑</span><strong>Choose an image from your device</strong><small>JPG, PNG, GIF or WEBP · maximum size 5 MB</small></div>
            )}
            <label className="pg-file-button">{selectedFile ? "Change photo" : "Choose photo"}
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} />
            </label>
            {selectedFile && <small className="pg-file-name">{selectedFile.name}</small>}
          </div>
          <div className="pg-upload-fields">
            <label htmlFor="photo-title">Photo title</label>
            <input id="photo-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Sunset at the beach" maxLength={120} required />
            <label htmlFor="photo-description">Description</label>
            <textarea id="photo-description" rows="4" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Write a short description..." maxLength={500} />
            <label htmlFor="photo-tags">Tags <span>(comma separated)</span></label>
            <input id="photo-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="travel, nature, family" />
            <label htmlFor="photo-album">Add to album</label>
            <select id="photo-album" value={selectedAlbumId} onChange={(event) => setSelectedAlbumId(event.target.value)}>
              <option value="">No album</option>
              {albums.map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}
            </select>
            <button type="submit" className="pg-submit-button" disabled={uploading}>
              {uploading ? "Uploading..." : "Add photo to gallery"}
            </button>
          </div>
        </form>
      </section>

      <section className="pg-section pg-gallery-section" id="pg-gallery">
        <div className="pg-section-heading pg-heading-row">
          <div><span className="pg-eyebrow">YOUR COLLECTION</span><h2>My Gallery</h2><p>View and manage your photos.</p></div>
          <div className="pg-gallery-count"><strong>{photos.length}</strong><span>photos</span></div>
        </div>
        <div className="pg-gallery-toolbar">
          <input type="search" value={galleryQuery} onChange={(event) => setGalleryQuery(event.target.value)} placeholder="Search your gallery by title..." aria-label="Search gallery by title" />
          <span>{galleryPhotos.length} result{galleryPhotos.length === 1 ? "" : "s"}</span>
        </div>
        {photosLoading ? (
          <div className="pg-empty"><h3>Loading your photos...</h3></div>
        ) : galleryPhotos.length ? (
          <div className="pg-photo-grid">
            {galleryPhotos.map((photo) => <PhotoCard key={photo.id} photo={photo} albums={albums} onView={setSelectedPhoto} onEdit={setEditingPhoto} onDelete={handleDeletePhoto} />)}
          </div>
        ) : <div className="pg-empty"><span>⌕</span><h3>No photos found</h3><p>Try another title or upload a new photo.</p></div>}
      </section>

      <section className="pg-section" id="pg-search">
        <div className="pg-section-heading"><span className="pg-eyebrow">FIND A MEMORY</span><h2>Search Photos</h2><p>Search your collection by photo name, tags or upload date.</p></div>
        <div className="pg-search-panel">
          <div className="pg-search-modes" role="group" aria-label="Search mode">
            <button type="button" className={searchMode === "name" ? "active" : ""} onClick={() => setSearchMode("name")}>▤ Name</button>
            <button type="button" className={searchMode === "tag" ? "active" : ""} onClick={() => setSearchMode("tag")}># Tag</button>
            <button type="button" className={searchMode === "date" ? "active" : ""} onClick={() => setSearchMode("date")}>▦ Date</button>
          </div>
          {searchMode !== "date" ? (
            <input type="text" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={searchMode === "tag" ? "Enter tags, separated by commas" : "Enter a photo name"} />
          ) : (
            <div className="pg-date-fields"><label>From <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label>To <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label></div>
          )}
          <button
            type="button"
            className="pg-submit-button pg-search-button"
            onClick={handleSearch}
            disabled={searchLoading}
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
          <p className="pg-search-hint">{searchMode === "tag" ? "For example: beach, family" : searchMode === "date" ? "Choose either date or a date range." : "For example: mountain"}</p>
        </div>
        <div id="pg-search-results" className="pg-search-results">

  {searchLoading ? (
    <div className="pg-empty">
      <h3>Searching your photos...</h3>
    </div>

  ) : !hasSearched ? (
    <div className="pg-empty">
      <span>⌕</span>
      <h3>Search your memories</h3>
      <p>Enter a name, tags or date and click Search.</p>
    </div>

  ) : searchResults.length > 0 ? (
    <>
      <p className="pg-result-count">
        <strong>{searchResults.length}</strong> matching photos
      </p>

      <div className="pg-photo-grid">
        {searchResults.map((photo) => (
          <PhotoCard
            key={`search-${photo.id}`}
            photo={photo}
            albums={albums}
            onView={setSelectedPhoto}
            onEdit={setEditingPhoto}
            onDelete={handleDeletePhoto}
          />
        ))}
      </div>
    </>

  ) : (
    <div className="pg-empty">
      <span>⌕</span>
      <h3>No matching photos</h3>
      <p>Try a different name, tag or date range.</p>
    </div>
  )}

</div>
      </section>

      <section className="pg-section pg-albums-section" id="pg-albums">
        <div className="pg-section-heading"><span className="pg-eyebrow">ORGANISE YOUR PHOTOS</span><h2>My Albums</h2><p>Create collections to organise related photos.</p></div>
        <form className="pg-album-create" onSubmit={handleCreateAlbum}>
          <div><label htmlFor="album-name">Album name</label><input id="album-name" value={newAlbumTitle} onChange={(event) => setNewAlbumTitle(event.target.value)} placeholder="e.g. College Events" maxLength={100} required /></div>
          <div><label htmlFor="album-description">Description</label><input id="album-description" value={newAlbumDescription} onChange={(event) => setNewAlbumDescription(event.target.value)} placeholder="Optional description" maxLength={250} /></div>
          <button className="pg-submit-button" type="submit">Create album</button>
        </form>
        <div className="pg-album-grid">
          {albumsLoading ? <div className="pg-empty"><h3>Loading your albums...</h3></div> : albums.map((album) => {
            const count = photos.filter((photo) => photo.albumId === album.id).length;
            return <article className="pg-album-card" key={album.id}><div className="pg-album-icon">▣</div><div><h3>{album.title}</h3><p>{album.description || "No description"}</p><small>{count} photo{count === 1 ? "" : "s"}</small></div><button type="button" onClick={() => handleDeleteAlbum(album.id)} aria-label={`Delete ${album.title}`}>Delete</button></article>;
          })}
        </div>
        {!albumsLoading && !albums.length && <div className="pg-empty"><h3>No albums yet</h3><p>Create your first album above.</p></div>}
      </section>

      <section className="pg-section pg-settings-section" id="pg-settings">
        <div className="pg-section-heading"><span className="pg-eyebrow">ACCOUNT PREFERENCES</span><h2>Settings · Update Profile</h2><p>Keep your personal information up to date.</p></div>
        <div className="pg-profile-card">
          <div className="pg-profile-summary"><div className="pg-avatar">{profile.name?.charAt(0)?.toUpperCase() || "U"}</div><div><h3>{profile.name || "Your name"}</h3><p>{profile.email}</p></div></div>
          {profileLoading ? (
            <div className="pg-profile-details"><p>Loading profile from the server...</p></div>
          ) : editingProfile ? (
            <form className="pg-profile-form" onSubmit={handleSaveProfile}>
              <label htmlFor="profile-name">Full name</label><input id="profile-name" maxLength="120" value={profileDraft.name} onChange={(event) => setProfileDraft({ ...profileDraft, name: event.target.value })} required />
              <label htmlFor="profile-email">Email address</label><input id="profile-email" type="email" maxLength="190" value={profileDraft.email} onChange={(event) => setProfileDraft({ ...profileDraft, email: event.target.value })} required />
              <label htmlFor="profile-phone">Phone</label><input id="profile-phone" maxLength="30" value={profileDraft.phone || ""} onChange={(event) => setProfileDraft({ ...profileDraft, phone: event.target.value })} placeholder="Enter phone number" />
              <label htmlFor="profile-bio">Bio</label><textarea id="profile-bio" rows="3" maxLength="500" value={profileDraft.bio || ""} onChange={(event) => setProfileDraft({ ...profileDraft, bio: event.target.value })} placeholder="A few words about yourself" />
              <div className="pg-profile-actions"><button className="pg-submit-button" type="submit" disabled={profileSaving}>{profileSaving ? "Saving..." : "Save changes"}</button><button className="pg-reset-button" type="button" disabled={profileSaving} onClick={() => { setProfileDraft(profile); setEditingProfile(false); }}>Cancel</button></div>
            </form>
          ) : (
            <div className="pg-profile-details"><div><span>Name</span><strong>{profile.name || "Not provided"}</strong></div><div><span>Email</span><strong>{profile.email || "Not provided"}</strong></div><div><span>Phone</span><strong>{profile.phone || "Not added"}</strong></div><div><span>Bio</span><strong>{profile.bio || "No bio added"}</strong></div><button className="pg-submit-button" type="button" onClick={() => { setProfileDraft(profile); setEditingProfile(true); }}>Edit profile</button></div>
          )}
        </div>
      </section>

      {selectedPhoto && (
        <div className="pg-modal-overlay" role="presentation" onClick={() => setSelectedPhoto(null)}>
          <div className="pg-modal" role="dialog" aria-modal="true" aria-label="Photo details" onClick={(event) => event.stopPropagation()}>
            <button className="pg-modal-close" type="button" onClick={() => setSelectedPhoto(null)} aria-label="Close">×</button>
            <img src={selectedPhoto.image} alt={selectedPhoto.title} />
            <h2>{selectedPhoto.title}</h2><p>{selectedPhoto.description}</p>
            {selectedPhoto.tags && <small>Tags: {selectedPhoto.tags}</small>}
          </div>
        </div>
      )}

      {editingPhoto && (
        <div className="pg-modal-overlay" role="presentation" onClick={() => setEditingPhoto(null)}>
          <form className="pg-modal pg-edit-modal" role="dialog" aria-modal="true" aria-label="Edit photo" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); handleSavePhotoEdit(); }}>
            <button className="pg-modal-close" type="button" onClick={() => setEditingPhoto(null)} aria-label="Close">×</button>
            <h2>Edit photo details</h2>
            <label htmlFor="edit-title">Title</label><input id="edit-title" value={editingPhoto.title} onChange={(event) => setEditingPhoto({ ...editingPhoto, title: event.target.value })} required />
            <label htmlFor="edit-description">Description</label><textarea id="edit-description" rows="3" value={editingPhoto.description || ""} onChange={(event) => setEditingPhoto({ ...editingPhoto, description: event.target.value })} />
            <label htmlFor="edit-tags">Tags</label><input id="edit-tags" value={editingPhoto.tags || ""} onChange={(event) => setEditingPhoto({ ...editingPhoto, tags: event.target.value })} />
            <label htmlFor="edit-album">Album</label><select id="edit-album" value={editingPhoto.albumId || ""} onChange={(event) => setEditingPhoto({ ...editingPhoto, albumId: event.target.value ? Number(event.target.value) : null })}><option value="">No album</option>{albums.map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}</select>
            <button className="pg-submit-button" type="submit">Save changes</button>
          </form>
        </div>
      )}

      <footer className="pg-footer"><strong>PhotoGallery</strong><span>Advanced Web Technology · Group Project</span><span>Signed in as {currentUser?.name || currentUser?.email || "Demo User"}</span></footer>
    </div>
  );
}

export default PhotoGalleryWorkspace;
