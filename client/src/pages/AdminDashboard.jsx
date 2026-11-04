
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminDashboard.css";

const API_ORIGIN = "http://127.0.0.1:5000";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN");
}

function getImageUrl(filepath) {
  if (!filepath) return "";

  
  if (filepath.startsWith("http://") || filepath.startsWith("https://")) {
    return filepath;
  }

  return `${API_ORIGIN}${filepath.startsWith("/") ? "" : "/"}${filepath}`;
}


function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");

  const [stats, setStats] = useState({
    users: 0,
    albums: 0,
    photos: 0,
  });

  const [users, setUsers] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  let currentUserId = null;

  try {
    const loggedInUser = JSON.parse(
      localStorage.getItem("loggedInUser") || "null"
    );

    currentUserId = loggedInUser?.id || null;
  } catch (err) {
    console.error("Could not read admin information.");
  }

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [summaryResponse, usersResponse, albumsResponse, photosResponse] =
          await Promise.all([
            api.get("/api/admin/summary"),
            api.get("/api/admin/users"),
            api.get("/api/admin/albums"),
            api.get("/api/admin/photos"),
          ]);

        if (!isActive) return;

        setStats(summaryResponse.data);
        setUsers(usersResponse.data.users || []);
        setAlbums(albumsResponse.data.albums || []);
        setPhotos(photosResponse.data.photos || []);

      } catch (err) {
        if (!isActive) return;

        setError(
          err.response?.data?.message ||
          "Unable to load the Admin Dashboard. Please check administrator access."
        );
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return users.filter((user) =>
      `${user.name} ${user.email} ${user.role}`
        .toLowerCase()
        .includes(term)
    );
  }, [users, searchTerm]);

  const filteredAlbums = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return albums.filter((album) =>
      `${album.title} ${album.creator} ${album.creator_email}`
        .toLowerCase()
        .includes(term)
    );
  }, [albums, searchTerm]);

  const filteredPhotos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return photos.filter((photo) =>
      `${photo.title} ${photo.uploaded_by} ${photo.album_title || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [photos, searchTerm]);

  async function deleteItem(type, item) {
    const labels = {
      users: "user",
      albums: "album",
      photos: "photo",
    };

    const label = labels[type];

    if (!window.confirm(`Are you sure you want to delete this ${label}?`)) {
      return;
    }

    try {
      const response = await api.delete(
        `/api/admin/${type}/${item.id}`
      );

      setNotice(response.data.message || `${label} deleted successfully.`);
      setError("");

      if (type === "photos" && selectedPhoto?.id === item.id) {
        setSelectedPhoto(null);
      }

      setRefreshKey((value) => value + 1);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        `Could not delete this ${label}.`
      );
    }
  }

  function renderEmpty(message) {
    return (
      <div className="admin-empty">
        <span>⌕</span>
        <h3>{message}</h3>
        <p>There is nothing to display here right now.</p>
      </div>
    );
  }

  return (
    <main className="admin-dashboard">

      <section className="admin-heading">
        <div>
          <span className="admin-eyebrow">SYSTEM CONTROL CENTER</span>

          <h1>Admin Dashboard</h1>

          <p>
            Manage registered users, photo albums and uploaded photos.
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh"
          onClick={() => {
            setNotice("");
            setRefreshKey((value) => value + 1);
          }}
          disabled={loading}
        >
          ↻ {loading ? "Loading..." : "Refresh Data"}
        </button>
      </section>

      {error && (
        <div className="admin-alert admin-error">
          {error}
        </div>
      )}

      {notice && (
        <div className="admin-alert admin-success">
          {notice}
        </div>
      )}

      <section className="admin-stats">

        <button
          type="button"
          className={`admin-stat-card ${activeTab === "users" ? "selected" : ""}`}
          onClick={() => {
            setActiveTab("users");
            setSearchTerm("");
          }}
        >
          <span className="admin-stat-icon">👥</span>
          <span className="admin-stat-label">Total Users</span>
          <strong>{stats.users}</strong>
          <small>Registered accounts</small>
        </button>

        <button
          type="button"
          className={`admin-stat-card ${activeTab === "albums" ? "selected" : ""}`}
          onClick={() => {
            setActiveTab("albums");
            setSearchTerm("");
          }}
        >
          <span className="admin-stat-icon">📁</span>
          <span className="admin-stat-label">Total Albums</span>
          <strong>{stats.albums}</strong>
          <small>Created collections</small>
        </button>

        <button
          type="button"
          className={`admin-stat-card ${activeTab === "photos" ? "selected" : ""}`}
          onClick={() => {
            setActiveTab("photos");
            setSearchTerm("");
          }}
        >
          <span className="admin-stat-icon">🖼️</span>
          <span className="admin-stat-label">Total Photos</span>
          <strong>{stats.photos}</strong>
          <small>Uploaded images</small>
        </button>

      </section>

      <section className="admin-content">

        <div className="admin-toolbar">

          <div className="admin-tabs">
            <button
              type="button"
              className={activeTab === "users" ? "active" : ""}
              onClick={() => {
                setActiveTab("users");
                setSearchTerm("");
              }}
            >
              Users ({users.length})
            </button>

            <button
              type="button"
              className={activeTab === "albums" ? "active" : ""}
              onClick={() => {
                setActiveTab("albums");
                setSearchTerm("");
              }}
            >
              Albums ({albums.length})
            </button>

            <button
              type="button"
              className={activeTab === "photos" ? "active" : ""}
              onClick={() => {
                setActiveTab("photos");
                setSearchTerm("");
              }}
            >
              Photos ({photos.length})
            </button>
          </div>

          <input
            className="admin-search"
            type="search"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

        </div>

        {loading ? (
          <div className="admin-loading">
            Loading dashboard information...
          </div>
        ) : (
          <>

            {activeTab === "users" && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.length ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>#{user.id}</td>

                          <td>
                            <strong>{user.name}</strong>
                          </td>

                          <td>{user.email}</td>

                          <td>
                            <span
                              className={`admin-role ${user.role === "admin" ? "is-admin" : ""}`}
                            >
                              {user.role}
                            </span>
                          </td>

                          <td>{formatDate(user.created_at)}</td>

                          <td>
                            <button
                              type="button"
                              className="admin-delete"
                              disabled={Number(user.id) === Number(currentUserId)}
                              title={
                                Number(user.id) === Number(currentUserId)
                                  ? "You cannot delete your own account"
                                  : "Delete user"
                              }
                              onClick={() => deleteItem("users", user)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">
                          {renderEmpty("No matching users found")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "albums" && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Album Title</th>
                      <th>Created By</th>
                      <th>Photos</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAlbums.length ? (
                      filteredAlbums.map((album) => (
                        <tr key={album.id}>
                          <td>#{album.id}</td>

                          <td>
                            <strong>{album.title}</strong>
                          </td>

                          <td>{album.creator}</td>

                          <td>{album.photo_count}</td>

                          <td>{formatDate(album.created_at)}</td>

                          <td>
                            <button
                              type="button"
                              className="admin-delete"
                              onClick={() => deleteItem("albums", album)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">
                          {renderEmpty("No matching albums found")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "photos" && (
              <div className="admin-photo-grid">
                {filteredPhotos.length ? (
                  filteredPhotos.map((photo) => (
                    <article className="admin-photo-card" key={photo.id}>

                      <button
                        type="button"
                        className="admin-photo-preview"
                        onClick={() => setSelectedPhoto(photo)}
                        title="Preview photo"
                      >
                        <img
                          src={getImageUrl(photo.filepath)}
                          alt={photo.title}
                        />
                      </button>

                      <div className="admin-photo-details">
                        <h3>{photo.title}</h3>

                        <p>
                          Album: {photo.album_title || "Unassigned"}
                        </p>

                        <p>
                          Uploaded by: {photo.uploaded_by}
                        </p>

                        <p>
                          Date: {formatDate(photo.upload_date)}
                        </p>

                        <div className="admin-photo-actions">
                          <button
                            type="button"
                            className="admin-view"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="admin-delete"
                            onClick={() => deleteItem("photos", photo)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                    </article>
                  ))
                ) : (
                  renderEmpty("No matching photos found")
                )}
              </div>
            )}

          </>
        )}

      </section>

      {selectedPhoto && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setSelectedPhoto(null)}
        >
          <section
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-heading">
              <h2>{selectedPhoto.title}</h2>

              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>

            <img
              src={getImageUrl(selectedPhoto.filepath)}
              alt={selectedPhoto.title}
            />

            <div className="admin-modal-info">
              <p><strong>Photo ID:</strong> {selectedPhoto.id}</p>
              <p><strong>Uploaded by:</strong> {selectedPhoto.uploaded_by}</p>
              <p><strong>Album:</strong> {selectedPhoto.album_title || "Unassigned"}</p>
              <p><strong>Tags:</strong> {selectedPhoto.tags || "None"}</p>
            </div>
          </section>
        </div>
      )}

    </main>
  );
}

export default AdminDashboard;
