import React, { useState, useEffect, useRef, useCallback } from "react";

import InviteBonusSection from "./InviteBonusSection";

import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

// import "./App.css";



import Earn from "./Earn";

import Wallet from "./Wallet";

import Profile from "./Profile";

// AdSense review safe: temporarily disabled
// import LuckyDraw from "./LuckyDraw";

// AdSense review safe: temporarily disabled
// import Winner from "./Winner";

import AdminDeposits from "./AdminDeposits";

// AdSense review safe: temporarily disabled
// import SamatkarGamingArena from "./SamatkarGamingArena";

import PrivacyPolicy, { Terms, RefundPolicy } from "./PolicyPages";

import { LanguageProvider, useLanguage } from "./LanguageContext";

// AdSense review safe: temporarily disabled
// import Bannerad from "./Bannerad";
// AdSense review safe: temporarily disabled
// import NativeBanner from "./NativeBanner";
// AdSense review safe: temporarily disabled
// import Banner320 from "./Banner320";
import { io } from "socket.io-client";



// 🌐 LIVE BACKEND URL CONFIGURED

const BACKEND_URL = "https://my-react-backend-production-84e7.up.railway.app";

const USER_TOKEN_KEY = "samatkaarUserSession";




const NOTIFICATION_ICONS = {
  friend_request: "👤",
  friend_response: "🤝",
  challenge: "🎮",
  challenge_accepted: "⚔️",
  challenge_rejected: "❌",
  deposit_approved: "💰",
  deposit_rejected: "⚠️",
  admin_message: "📢",
  message: "💬",
  system: "🔔"
};

function formatNotificationTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const diff = Math.max(0, Date.now() - date.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  return date.toLocaleDateString();
}

function NotificationCenter({
  user,
  navigateToPage,
  triggerNotification
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [liveNotice, setLiveNotice] = useState(null);
  const [adminComposerOpen, setAdminComposerOpen] = useState(false);
  const [adminSending, setAdminSending] = useState(false);
  const [adminForm, setAdminForm] = useState({
    target: "all",
    phone: "",
    title: "",
    message: "",
    priority: "important"
  });

  const socketRef = useRef(null);
  const liveTimerRef = useRef(null);

  const getToken = () =>
    localStorage.getItem(USER_TOKEN_KEY) || "";

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
  });

  const loadNotifications = useCallback(
    async (silent = false) => {
      if (!user?.id || !getToken()) return;

      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await fetch(
          `${BACKEND_URL}/api/notifications?limit=60`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${getToken()}`
            },
            cache: "no-store"
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error || "Notifications load nahi ho sake."
          );
        }

        setNotifications(
          Array.isArray(data.notifications)
            ? data.notifications
            : []
        );
        setUnreadCount(Number(data.unreadCount || 0));
      } catch (err) {
        console.error("Notification load error:", err);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setOpen(false);
      return;
    }

    loadNotifications();

    const polling = window.setInterval(() => {
      loadNotifications(true);
    }, 30000);

    return () => {
      window.clearInterval(polling);
    };
  }, [user?.id, loadNotifications]);

  useEffect(() => {
    if (!user?.id || !getToken()) return;

    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 700,
      reconnectionDelayMax: 5000
    });

    socketRef.current = socket;

    const subscribe = () => {
      socket.emit("notification:subscribe", {
        token: getToken()
      });
    };

    const onNewNotification = (notification) => {
      if (!notification?.id) return;

      setNotifications((prev) => {
        if (
          prev.some(
            (item) => item.id === notification.id
          )
        ) {
          return prev;
        }

        return [notification, ...prev].slice(0, 80);
      });

      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }

      setLiveNotice(notification);

      if (liveTimerRef.current) {
        window.clearTimeout(liveTimerRef.current);
      }

      liveTimerRef.current = window.setTimeout(() => {
        setLiveNotice(null);
      }, 5200);
    };

    socket.on("connect", subscribe);
    socket.on("notification:new", onNewNotification);

    return () => {
      if (liveTimerRef.current) {
        window.clearTimeout(liveTimerRef.current);
      }

      socket.off("connect", subscribe);
      socket.off(
        "notification:new",
        onNewNotification
      );
      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [user?.id]);

  const markRead = async (id) => {
    const existing = notifications.find(
      (item) => item.id === id
    );

    if (!existing || existing.read) return;

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, read: true }
          : item
      )
    );
    setUnreadCount((prev) =>
      Math.max(0, prev - 1)
    );

    try {
      await fetch(
        `${BACKEND_URL}/api/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: authHeaders()
        }
      );
    } catch (err) {
      console.error(
        "Notification read sync failed:",
        err
      );
      loadNotifications(true);
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read: true
      }))
    );
    setUnreadCount(0);

    try {
      await fetch(
        `${BACKEND_URL}/api/notifications/mark-all-read`,
        {
          method: "POST",
          headers: authHeaders()
        }
      );
    } catch (err) {
      console.error("Mark all read failed:", err);
      loadNotifications(true);
    }
  };

  const deleteNotification = async (id) => {
    const existing = notifications.find(
      (item) => item.id === id
    );

    setNotifications((prev) =>
      prev.filter((item) => item.id !== id)
    );

    if (existing && !existing.read) {
      setUnreadCount((prev) =>
        Math.max(0, prev - 1)
      );
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/notifications/${id}`,
        {
          method: "DELETE",
          headers: authHeaders()
        }
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error(
        "Notification delete failed:",
        err
      );
      loadNotifications(true);
    }
  };

  const actOnFriendRequest = async (
    notification,
    action
  ) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/notifications/${notification.id}/action`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ action })
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Action complete nahi ho saka."
        );
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read: true,
                actionStatus:
                  action === "accept"
                    ? "accepted"
                    : "rejected"
              }
            : item
        )
      );

      if (!notification.read) {
        setUnreadCount((prev) =>
          Math.max(0, prev - 1)
        );
      }

      triggerNotification(
        action === "accept"
          ? "✅ Friend request accepted."
          : "Friend request rejected.",
        action === "accept"
          ? "success"
          : "info"
      );
    } catch (err) {
      triggerNotification(
        `⚠️ ${err.message}`,
        "error"
      );
    }
  };

  const openChallenge = async (
    notification
  ) => {
    try {
      await fetch(
        `${BACKEND_URL}/api/notifications/${notification.id}/action`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            action: "open"
          })
        }
      );
    } catch {}

    markRead(notification.id);
    setOpen(false);
    triggerNotification("🎮 Gaming Arena is temporarily paused during AdSense review.", "info");
    navigateToPage("home");
  };

  const sendAdminNotification = async (
    event
  ) => {
    event.preventDefault();

    if (
      !adminForm.title.trim() ||
      !adminForm.message.trim()
    ) {
      triggerNotification(
        "⚠️ Title aur message required hain.",
        "error"
      );
      return;
    }

    if (
      adminForm.target === "specific" &&
      !adminForm.phone.trim()
    ) {
      triggerNotification(
        "⚠️ User ka phone number likhein.",
        "error"
      );
      return;
    }

    setAdminSending(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/notifications/broadcast`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            target: adminForm.target,
            phone: adminForm.phone.trim(),
            title: adminForm.title.trim(),
            message: adminForm.message.trim(),
            priority: adminForm.priority
          })
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Notification send nahi ho saka."
        );
      }

      triggerNotification(
        `📢 Notification ${
          data.sentCount || 0
        } user(s) ko send ho gaya.`,
        "success"
      );

      setAdminForm({
        target: "all",
        phone: "",
        title: "",
        message: "",
        priority: "important"
      });
      setAdminComposerOpen(false);
    } catch (err) {
      triggerNotification(
        `⚠️ ${err.message}`,
        "error"
      );
    } finally {
      setAdminSending(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        className="samatkaar-notification-fab"
        onClick={() => {
          setOpen((prev) => !prev);

          if (!open) {
            loadNotifications(true);
          }
        }}
        aria-label="Open notifications"
        title="Notifications"
      >
        <span className="notification-fab-icon">
          💬
        </span>

        {unreadCount > 0 && (
          <span className="notification-fab-badge">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {liveNotice && !open && (
        <button
          type="button"
          className="notification-live-toast"
          onClick={() => {
            setOpen(true);
            markRead(liveNotice.id);
            setLiveNotice(null);
          }}
        >
          <span className="notification-live-icon">
            {NOTIFICATION_ICONS[
              liveNotice.type
            ] || "🔔"}
          </span>

          <span className="notification-live-copy">
            <strong>{liveNotice.title}</strong>
            <small>{liveNotice.message}</small>
          </span>
        </button>
      )}

      {open && (
        <>
          <button
            type="button"
            className="notification-drawer-backdrop"
            onClick={() => setOpen(false)}
            aria-label="Close notification center"
          />

          <aside
            className="notification-drawer"
            aria-label="Notification Center"
          >
            <div className="notification-drawer-header">
              <div>
                <span className="notification-eyebrow">
                  SAMATKAAR LIVE
                </span>
                <h3>Notifications</h3>
                <p>
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : "You're all caught up"}
                </p>
              </div>

              <button
                type="button"
                className="notification-close-btn"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="notification-toolbar">
              <button
                type="button"
                onClick={() =>
                  loadNotifications()
                }
              >
                ↻ Refresh
              </button>

              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
              >
                ✓ Read all
              </button>

              {user?.role === "admin" && (
                <button
                  type="button"
                  className="notification-admin-btn"
                  onClick={() =>
                    setAdminComposerOpen(
                      (prev) => !prev
                    )
                  }
                >
                  📢 Send Notice
                </button>
              )}
            </div>

            {user?.role === "admin" &&
              adminComposerOpen && (
                <form
                  className="notification-admin-composer"
                  onSubmit={
                    sendAdminNotification
                  }
                >
                  <div className="notification-admin-title">
                    <strong>
                      Admin Broadcast
                    </strong>
                    <span>
                      Only admin can send
                    </span>
                  </div>

                  <div className="notification-target-row">
                    <button
                      type="button"
                      className={
                        adminForm.target ===
                        "all"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setAdminForm(
                          (prev) => ({
                            ...prev,
                            target: "all",
                            phone: ""
                          })
                        )
                      }
                    >
                      All Users
                    </button>

                    <button
                      type="button"
                      className={
                        adminForm.target ===
                        "specific"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setAdminForm(
                          (prev) => ({
                            ...prev,
                            target:
                              "specific"
                          })
                        )
                      }
                    >
                      One User
                    </button>
                  </div>

                  {adminForm.target ===
                    "specific" && (
                    <input
                      value={
                        adminForm.phone
                      }
                      onChange={(event) =>
                        setAdminForm(
                          (prev) => ({
                            ...prev,
                            phone:
                              event.target
                                .value
                          })
                        )
                      }
                      placeholder="User phone number"
                      maxLength={30}
                    />
                  )}

                  <input
                    value={adminForm.title}
                    onChange={(event) =>
                      setAdminForm(
                        (prev) => ({
                          ...prev,
                          title:
                            event.target
                              .value
                        })
                      )
                    }
                    placeholder="Notification title"
                    maxLength={120}
                  />

                  <textarea
                    value={adminForm.message}
                    onChange={(event) =>
                      setAdminForm(
                        (prev) => ({
                          ...prev,
                          message:
                            event.target
                              .value
                        })
                      )
                    }
                    placeholder="Write your important message..."
                    maxLength={1200}
                    rows={4}
                  />

                  <select
                    value={
                      adminForm.priority
                    }
                    onChange={(event) =>
                      setAdminForm(
                        (prev) => ({
                          ...prev,
                          priority:
                            event.target
                              .value
                        })
                      )
                    }
                  >
                    <option value="important">
                      🔴 Important
                    </option>
                    <option value="normal">
                      🔵 Normal
                    </option>
                  </select>

                  <button
                    type="submit"
                    className="notification-send-btn"
                    disabled={adminSending}
                  >
                    {adminSending
                      ? "Sending..."
                      : "Send Notification"}
                  </button>
                </form>
              )}

            <div className="notification-list">
              {loading &&
              notifications.length === 0 ? (
                <div className="notification-empty">
                  <span>⏳</span>
                  <strong>
                    Loading notifications...
                  </strong>
                </div>
              ) : notifications.length ===
                0 ? (
                <div className="notification-empty">
                  <span>🔕</span>
                  <strong>
                    No notifications yet
                  </strong>
                  <small>
                    Friend requests,
                    challenges and official
                    updates will appear here.
                  </small>
                </div>
              ) : (
                notifications.map(
                  (notification) => {
                    const pendingFriend =
                      notification.type ===
                        "friend_request" &&
                      notification.actionStatus ===
                        "pending";

                    return (
                      <article
                        key={
                          notification.id
                        }
                        className={`notification-card ${
                          notification.read
                            ? "read"
                            : "unread"
                        } ${
                          notification.data
                            ?.priority ===
                          "important"
                            ? "important"
                            : ""
                        }`}
                        onClick={() =>
                          markRead(
                            notification.id
                          )
                        }
                      >
                        <div className="notification-card-icon">
                          {NOTIFICATION_ICONS[
                            notification.type
                          ] || "🔔"}
                        </div>

                        <div className="notification-card-body">
                          <div className="notification-card-top">
                            <strong>
                              {
                                notification.title
                              }
                            </strong>

                            {!notification.read && (
                              <span className="notification-unread-dot" />
                            )}
                          </div>

                          <p>
                            {
                              notification.message
                            }
                          </p>

                          <div className="notification-meta">
                            <span>
                              {formatNotificationTime(
                                notification.createdAt
                              )}
                            </span>

                            {notification.senderName && (
                              <span>
                                •{" "}
                                {
                                  notification.senderName
                                }
                              </span>
                            )}
                          </div>

                          {pendingFriend && (
                            <div className="notification-actions">
                              <button
                                type="button"
                                className="accept"
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();
                                  actOnFriendRequest(
                                    notification,
                                    "accept"
                                  );
                                }}
                              >
                                ✓ Accept
                              </button>

                              <button
                                type="button"
                                className="reject"
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();
                                  actOnFriendRequest(
                                    notification,
                                    "reject"
                                  );
                                }}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}

                          {notification.type ===
                            "challenge" &&
                            notification.actionStatus ===
                              "pending" && (
                              <div className="notification-actions">
                                <button
                                  type="button"
                                  className="open-game"
                                  onClick={(
                                    event
                                  ) => {
                                    event.stopPropagation();
                                    openChallenge(
                                      notification
                                    );
                                  }}
                                >
                                  🎮 Open Gaming
                                  Arena
                                </button>
                              </div>
                            )}

                          {[
                            "accepted",
                            "rejected"
                          ].includes(
                            notification.actionStatus
                          ) && (
                            <div
                              className={`notification-status ${notification.actionStatus}`}
                            >
                              {notification.actionStatus ===
                              "accepted"
                                ? "✓ Accepted"
                                : "✕ Rejected"}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className="notification-delete-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteNotification(
                              notification.id
                            );
                          }}
                          title="Delete"
                        >
                          ×
                        </button>
                      </article>
                    );
                  }
                )
              )}
            </div>
          </aside>
        </>
      )}

      <style>{`
        .samatkaar-notification-fab{
          position:fixed;
          z-index:2147481000;
          right:18px;
          top:86px;
          width:52px;
          height:52px;
          border:none;
          border-radius:17px;
          display:grid;
          place-items:center;
          cursor:pointer;
          background:linear-gradient(145deg,#0f172a,#172554);
          color:#fff;
          box-shadow:0 16px 40px rgba(2,6,23,.38),inset 0 0 0 1px rgba(255,255,255,.12);
          transition:transform .18s ease,box-shadow .18s ease;
        }
        .samatkaar-notification-fab:hover{
          transform:translateY(-2px) scale(1.03);
          box-shadow:0 20px 45px rgba(2,6,23,.48)
        }
        .notification-fab-icon{
          font-size:23px;
          line-height:1
        }
        .notification-fab-badge{
          position:absolute;
          top:-6px;
          right:-5px;
          min-width:21px;
          height:21px;
          padding:0 5px;
          display:grid;
          place-items:center;
          border-radius:999px;
          background:#ef4444;
          color:white;
          border:2px solid #fff;
          font:800 11px/1 system-ui;
          box-shadow:0 4px 12px rgba(239,68,68,.45);
        }
        .notification-live-toast{
          position:fixed;
          z-index:2147482000;
          right:82px;
          top:86px;
          width:min(360px,calc(100vw - 110px));
          border:1px solid rgba(255,255,255,.14);
          border-radius:18px;
          background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(30,41,59,.98));
          color:#fff;
          padding:13px 15px;
          display:flex;
          gap:12px;
          text-align:left;
          cursor:pointer;
          box-shadow:0 20px 55px rgba(2,6,23,.5);
          animation:notificationToastIn .26s ease-out;
        }
        .notification-live-icon{
          width:38px;
          height:38px;
          flex:0 0 38px;
          display:grid;
          place-items:center;
          border-radius:12px;
          background:rgba(59,130,246,.16);
          font-size:20px;
        }
        .notification-live-copy{
          display:flex;
          flex-direction:column;
          gap:3px;
          min-width:0
        }
        .notification-live-copy strong{
          font-size:13px;
          color:#f8fafc
        }
        .notification-live-copy small{
          font-size:12px;
          color:#cbd5e1;
          line-height:1.35;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis
        }
        .notification-drawer-backdrop{
          position:fixed;
          inset:0;
          z-index:2147482500;
          border:none;
          background:rgba(2,6,23,.38);
          backdrop-filter:blur(2px);
          cursor:default;
        }
        .notification-drawer{
          position:fixed;
          z-index:2147483000;
          top:0;
          right:0;
          bottom:0;
          width:min(410px,100vw);
          display:flex;
          flex-direction:column;
          background:linear-gradient(180deg,#07111f 0%,#0b1220 42%,#090f1a 100%);
          color:#e2e8f0;
          border-left:1px solid rgba(148,163,184,.16);
          box-shadow:-26px 0 70px rgba(2,6,23,.58);
          animation:notificationDrawerIn .25s ease-out;
        }
        .notification-drawer-header{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:12px;
          padding:20px 18px 14px;
          border-bottom:1px solid rgba(148,163,184,.13);
          background:rgba(15,23,42,.72);
          backdrop-filter:blur(16px);
        }
        .notification-eyebrow{
          font-size:9px;
          letter-spacing:.17em;
          color:#60a5fa;
          font-weight:900
        }
        .notification-drawer-header h3{
          margin:3px 0 1px;
          font-size:22px;
          color:#fff
        }
        .notification-drawer-header p{
          margin:0;
          color:#94a3b8;
          font-size:12px
        }
        .notification-close-btn{
          width:36px;
          height:36px;
          border-radius:11px;
          border:1px solid rgba(148,163,184,.16);
          background:#111827;
          color:#cbd5e1;
          cursor:pointer;
          font-size:15px
        }
        .notification-toolbar{
          display:flex;
          gap:7px;
          padding:10px 12px;
          border-bottom:1px solid rgba(148,163,184,.1);
          overflow-x:auto;
          background:#0b1322
        }
        .notification-toolbar button{
          flex:0 0 auto;
          border:1px solid rgba(148,163,184,.16);
          border-radius:10px;
          background:#111827;
          color:#cbd5e1;
          padding:8px 10px;
          font-size:11px;
          font-weight:800;
          cursor:pointer
        }
        .notification-toolbar button:disabled{
          opacity:.4;
          cursor:not-allowed
        }
        .notification-toolbar .notification-admin-btn{
          background:#172554;
          color:#bfdbfe;
          border-color:#1d4ed8
        }
        .notification-admin-composer{
          margin:10px 12px 4px;
          padding:13px;
          border-radius:15px;
          border:1px solid rgba(96,165,250,.2);
          background:linear-gradient(145deg,#0f172a,#111c32);
          display:flex;
          flex-direction:column;
          gap:9px
        }
        .notification-admin-title{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:8px
        }
        .notification-admin-title strong{
          font-size:13px;
          color:#fff
        }
        .notification-admin-title span{
          font-size:9px;
          color:#60a5fa;
          text-transform:uppercase;
          font-weight:800
        }
        .notification-admin-composer input,
        .notification-admin-composer textarea,
        .notification-admin-composer select{
          width:100%;
          border:1px solid #273449;
          border-radius:10px;
          background:#07111f;
          color:#e5e7eb;
          padding:10px 11px;
          outline:none;
          font:500 12px/1.4 system-ui
        }
        .notification-admin-composer textarea{
          resize:vertical;
          min-height:78px
        }
        .notification-target-row{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:7px
        }
        .notification-target-row button{
          border:1px solid #26364c;
          border-radius:9px;
          background:#0b1423;
          color:#94a3b8;
          padding:8px;
          cursor:pointer;
          font-size:11px;
          font-weight:800
        }
        .notification-target-row button.active{
          background:#1d4ed8;
          color:white;
          border-color:#3b82f6
        }
        .notification-send-btn{
          border:none;
          border-radius:10px;
          background:linear-gradient(135deg,#2563eb,#4f46e5);
          color:white;
          padding:10px 12px;
          font-size:12px;
          font-weight:900;
          cursor:pointer
        }
        .notification-list{
          flex:1;
          overflow-y:auto;
          padding:10px 10px 24px
        }
        .notification-card{
          position:relative;
          display:grid;
          grid-template-columns:42px 1fr auto;
          gap:10px;
          margin-bottom:8px;
          padding:12px 9px 12px 11px;
          border-radius:15px;
          border:1px solid rgba(148,163,184,.11);
          background:rgba(15,23,42,.72);
          cursor:pointer;
          transition:background .16s ease,border-color .16s ease,transform .16s ease;
        }
        .notification-card:hover{
          background:#111c2e;
          border-color:rgba(96,165,250,.22);
          transform:translateY(-1px)
        }
        .notification-card.unread{
          background:linear-gradient(145deg,rgba(30,58,138,.2),rgba(15,23,42,.88));
          border-color:rgba(96,165,250,.25)
        }
        .notification-card.important{
          box-shadow:inset 3px 0 0 #ef4444
        }
        .notification-card-icon{
          width:42px;
          height:42px;
          border-radius:13px;
          display:grid;
          place-items:center;
          background:#111827;
          border:1px solid rgba(148,163,184,.13);
          font-size:20px
        }
        .notification-card-body{
          min-width:0
        }
        .notification-card-top{
          display:flex;
          align-items:center;
          gap:7px
        }
        .notification-card-top strong{
          font-size:12.5px;
          color:#f8fafc;
          line-height:1.25
        }
        .notification-unread-dot{
          width:7px;
          height:7px;
          border-radius:50%;
          background:#3b82f6;
          box-shadow:0 0 0 3px rgba(59,130,246,.14)
        }
        .notification-card p{
          margin:5px 0 7px;
          color:#cbd5e1;
          font-size:11.5px;
          line-height:1.45
        }
        .notification-meta{
          display:flex;
          gap:5px;
          color:#64748b;
          font-size:9.5px
        }
        .notification-actions{
          display:flex;
          flex-wrap:wrap;
          gap:7px;
          margin-top:9px
        }
        .notification-actions button{
          border:none;
          border-radius:9px;
          padding:7px 10px;
          color:#fff;
          font-size:10px;
          font-weight:900;
          cursor:pointer
        }
        .notification-actions .accept{
          background:#15803d
        }
        .notification-actions .reject{
          background:#7f1d1d
        }
        .notification-actions .open-game{
          background:#1d4ed8
        }
        .notification-status{
          display:inline-flex;
          margin-top:8px;
          border-radius:999px;
          padding:5px 8px;
          font-size:9px;
          font-weight:900
        }
        .notification-status.accepted{
          background:rgba(34,197,94,.14);
          color:#86efac
        }
        .notification-status.rejected{
          background:rgba(239,68,68,.14);
          color:#fca5a5
        }
        .notification-delete-btn{
          width:27px;
          height:27px;
          border:none;
          border-radius:8px;
          background:transparent;
          color:#64748b;
          cursor:pointer;
          font-size:17px
        }
        .notification-delete-btn:hover{
          background:#1f2937;
          color:#fca5a5
        }
        .notification-empty{
          min-height:260px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          text-align:center;
          color:#94a3b8;
          padding:30px
        }
        .notification-empty span{
          font-size:36px;
          margin-bottom:10px
        }
        .notification-empty strong{
          color:#e2e8f0;
          font-size:14px
        }
        .notification-empty small{
          margin-top:6px;
          max-width:250px;
          line-height:1.5
        }
        @keyframes notificationDrawerIn{
          from{
            transform:translateX(100%);
            opacity:.4
          }
          to{
            transform:translateX(0);
            opacity:1
          }
        }
        @keyframes notificationToastIn{
          from{
            transform:translateY(-10px) scale(.97);
            opacity:0
          }
          to{
            transform:none;
            opacity:1
          }
        }
        @media(max-width:700px){
          .samatkaar-notification-fab{
            top:66px;
            right:10px;
            width:45px;
            height:45px;
            border-radius:14px
          }
          .notification-fab-icon{
            font-size:20px
          }
          .notification-live-toast{
            top:118px;
            right:8px;
            left:8px;
            width:auto
          }
          .notification-drawer{
            top:56px;
            right:7px;
            bottom:7px;
            left:7px;
            width:auto;
            border:1px solid rgba(148,163,184,.16);
            border-radius:20px;
            overflow:hidden
          }
          .notification-drawer-header{
            padding:15px 14px 12px
          }
          .notification-drawer-header h3{
            font-size:19px
          }
          .notification-toolbar{
            padding:8px
          }
          .notification-card{
            grid-template-columns:38px 1fr auto;
            padding:10px 8px 10px 10px
          }
          .notification-card-icon{
            width:38px;
            height:38px;
            border-radius:12px;
            font-size:18px
          }
        }
      `}</style>
    </>
  );
}

function MainApp() {

  const { lang, setLang, currency, setCurrency, t, activeCurrency, convertCoins } = useLanguage();

  const navigate = useNavigate ? useNavigate() : null;



  const [page, setPage] = useState("home");

  const [menuOpen, setMenuOpen] = useState(false);

  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false); // Dropdown State for Desktop
  const [playDropdownOpen, setPlayDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [viewportWidth, setViewportWidth] = useState(() =>

    typeof window !== "undefined" ? window.innerWidth : 1200

  );

  const [showAuthModal, setShowAuthModal] = useState(false);

  const [isLoginMode, setIsLoginMode] = useState(false); // false = Signup, true = Login



  // Password Show/Hide Toggle State

  const [showPassword, setShowPassword] = useState(false);



  // Form states

  const [inputName, setInputName] = useState("");

  const [inputPhone, setInputPhone] = useState("");

  const [inputPassword, setInputPassword] = useState("");

  const [authError, setAuthError] = useState("");

  const [authSuccess, setAuthSuccess] = useState("");

  const [isAuthLoading, setIsAuthLoading] = useState(false); // Professional Login / Signup loading state



  // Persistent User Session

  const [user, setUser] = useState(() => {

    const saved = localStorage.getItem("goovoCurrentUser");

    return saved ? JSON.parse(saved) : null;

  });



  // Coins state synced with User or LocalStorage

  const [coins, setCoins] = useState(() => {

    const savedUser = localStorage.getItem("goovoCurrentUser");

    if (savedUser) {

      const parsed = JSON.parse(savedUser);

      return parsed.coins ?? Number(localStorage.getItem("goovoCoins")) ?? 0;

    }

    return Number(localStorage.getItem("goovoCoins")) || 0;

  });



  const [balanceHydrated, setBalanceHydrated] = useState(false);
  const coinSyncQueueRef = useRef(Promise.resolve());

  const [pendingPayments, setPendingPayments] = useState(() => {

    const saved = localStorage.getItem("goovoPendingPayments");

    return saved ? JSON.parse(saved) : [];

  });



  const [message, setMessage] = useState({ text: "", type: "success" });



  // Save session & coins

  useEffect(() => {

    if (user) {

      localStorage.setItem("goovoCurrentUser", JSON.stringify(user));

    } else {

      localStorage.removeItem("goovoCurrentUser");

    }

  }, [user]);



  useEffect(() => {
    localStorage.setItem("goovoCoins", String(coins));

    if (!user || !balanceHydrated) {
      return;
    }

    setUser((prev) => {
      if (!prev) return null;
      if (prev.coins === coins) return prev;
      return { ...prev, coins };
    });

    updateUserCoinsInDatabase(coins);
  }, [coins, balanceHydrated]);



  useEffect(() => {

    localStorage.setItem("goovoPendingPayments", JSON.stringify(pendingPayments));

  }, [pendingPayments]);



  // 📱 Responsive navbar: mobile / tablet / desktop

  useEffect(() => {

    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);

  }, []);



  const isMobile = viewportWidth <= 700;

  const isTablet = viewportWidth > 700 && viewportWidth <= 1100;

  const navStyles = getResponsiveNavStyles(isMobile, isTablet);



  // 🔒 Authenticated and ordered coin persistence.
  // Earlier frontend called /api/user/update-coins but the backend did not
  // actually provide that route, so MongoDB kept the signup balance (50).
  const updateUserCoinsInDatabase = (newCoins) => {
    const token = localStorage.getItem(USER_TOKEN_KEY);

    if (!token || !user) {
      return coinSyncQueueRef.current;
    }

    coinSyncQueueRef.current = coinSyncQueueRef.current
      .catch(() => {})
      .then(async () => {
        const response = await fetch(`${BACKEND_URL}/api/user/update-coins`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            coins: Math.max(0, Math.floor(Number(newCoins) || 0))
          })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
          throw new Error(data.error || "Coins save nahi ho sake.");
        }

        return data;
      })
      .catch((err) => {
        console.error("Failed to sync coins with backend:", err);
        throw err;
      });

    return coinSyncQueueRef.current;
  };

  // On refresh/re-open, server is the source of truth.
  useEffect(() => {
    const token = localStorage.getItem(USER_TOKEN_KEY);

    if (!user || !token) {
      setBalanceHydrated(true);
      return;
    }

    let cancelled = false;

    const loadLiveAccount = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/user/me`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          },
          cache: "no-store"
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.user) {
          throw new Error(data.error || "Account balance load nahi ho saka.");
        }

        if (cancelled) return;

        setUser(data.user);
        setCoins(Number(data.user.coins || 0));
      } catch (err) {
        console.error("Live account refresh failed:", err);
      } finally {
        if (!cancelled) {
          setBalanceHydrated(true);
        }
      }
    };

    loadLiveAccount();

    return () => {
      cancelled = true;
    };
  }, []);



  // 🔗 BACKEND LINKED: Permanent Sign Up Handler via Live Railway Backend API

  const handleRegisterSubmit = async (e) => {

    e.preventDefault();

    setAuthError("");

    setAuthSuccess("");



    if (!inputName.trim() || !inputPhone.trim() || !inputPassword.trim()) {

      setAuthError("⚠️ Meherbani karke saari fields bharein!");

      return;

    }



    setIsAuthLoading(true);

    try {

      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          name: inputName.trim(),

          phone: inputPhone.trim(),

          password: inputPassword.trim()

        })

      });



      const data = await response.json();



      if (!response.ok) {

        setAuthError(`⚠️ ${data.error || "Registration failed!"}`);

        return;

      }



      if (data.token) {
        localStorage.setItem(USER_TOKEN_KEY, data.token);
      }

      setBalanceHydrated(true);
      setUser(data.user);

      if (typeof data.user.coins === "number") {

        setCoins(data.user.coins);

      }



      setAuthSuccess("✅ Account permanently database me register ho gaya!");

      setTimeout(() => {

        setShowAuthModal(false);

        setAuthSuccess("");

        setInputName("");

        setInputPhone("");

        setInputPassword("");

      }, 1200);



    } catch (err) {

      setAuthError("❌ Backend server se connection nahi ho saka! Check karein server chal raha hai ya nahi.");

    } finally {

      setIsAuthLoading(false);

    }

  };



  // 🔗 BACKEND LINKED: Login Handler via Live Railway Backend API

  const handleLoginSubmit = async (e) => {

    e.preventDefault();

    setAuthError("");

    setAuthSuccess("");



    if (!inputPhone.trim() || !inputPassword.trim()) {

      setAuthError("⚠️ Phone number aur password dono likhein!");

      return;

    }



    setIsAuthLoading(true);

    try {

      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          phone: inputPhone.trim(),

          password: inputPassword

        })

      });



      const data = await response.json();



      if (!response.ok) {

        setAuthError(`❌ ${data.error || "Ghalat Phone Number ya Password!"}`);

        return;

      }



      if (data.token) {
        localStorage.setItem(USER_TOKEN_KEY, data.token);
      }

      setBalanceHydrated(true);
      setUser(data.user);

      if (typeof data.user.coins === "number") {

        setCoins(data.user.coins);

      }



      setAuthSuccess("✅ Login Successful from Database!");

      setTimeout(() => {

        setShowAuthModal(false);

        setAuthSuccess("");

        setInputPhone("");

        setInputPassword("");

      }, 1000);



    } catch (err) {

      setAuthError("❌ Backend server se connection nahi ho saka!");

    } finally {

      setIsAuthLoading(false);

    }

  };



  const handleLogout = async () => {
    try {
      if (user && balanceHydrated) {
        await updateUserCoinsInDatabase(coins);
        await coinSyncQueueRef.current.catch(() => {});
      }
    } catch (err) {
      console.error("Final balance sync before logout failed:", err);
    }

    setUser(null);
    setBalanceHydrated(false);

    localStorage.removeItem("goovoCurrentUser");
    localStorage.removeItem(USER_TOKEN_KEY);

    triggerNotification("👋 Logged out successfully!", "info");
    setPage("home");
  };



  const addCoins = (amount, customMessage) => {

    setCoins((prev) => prev + amount);

    triggerNotification(customMessage || `🎉 Coins updated: +${amount}`, "success");

  };



  const deductCoins = (amount, customMessage) => {

    if (coins < amount) {

      triggerNotification("⚠️ Insufficient coins balance!", "error");

      return false;

    }

    setCoins((prev) => prev - amount);

    triggerNotification(customMessage || `💸 Coins updated: -${amount}`, "info");

    return true;

  };



  const submitPaymentProof = (paymentData) => {

    if (!user) {

      setShowAuthModal(true);

      return;

    }

    const newEntry = {

      id: "TRX-" + Date.now(),

      userName: user.name || "User",

      userPhone: user.phone || "N/A",

      ...paymentData,

      status: "pending_verification",

      createdAt: new Date().toISOString()

    };

    setPendingPayments((prev) => [newEntry, ...prev]);

    triggerNotification("🚀 Receipt submitted successfully!", "success");

  };



  const triggerNotification = (text, type = "success") => {

    setMessage({ text, type });

    setTimeout(() => setMessage({ text: "", type: "success" }), 3000);

  };



  const navigateToPage = (newPage) => {
    if (["luckyDraw", "gamingArena", "winner"].includes(newPage)) {
      triggerNotification("⏳ This feature is temporarily paused during AdSense review.", "info");
      setPage("home");
      setMenuOpen(false);
      setAboutDropdownOpen(false);
      setPlayDropdownOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (newPage === "adminDeposits" && user?.role !== "admin") {
      triggerNotification("⛔ Admin access required.", "error");
      return;
    }

    if (!user && (newPage === "earn" || newPage === "wallet")) {

      triggerNotification("🔒 Feature access ke liye pehle Login / Signup karein!", "error");

      setShowAuthModal(true);

      return;

    }

    setPage(newPage);

    setMenuOpen(false);

    setAboutDropdownOpen(false);
    setPlayDropdownOpen(false);

    window.scrollTo({ top: 0, behavior: "smooth" });

  };



  return (

    <div className="app">

      {/* RESPONSIVE PROFESSIONAL NAVBAR */}

      <nav className="navbar" style={navStyles.navbar}>

        <div className="nav-left-group" style={navStyles.navLeftGroup}>

          <div

            className="brand"

            onClick={() => navigateToPage("home")}

            style={navStyles.brand}

          >

            <span style={navStyles.brandMark}>Z</span>

            <span>SAMATKAAR</span>

          </div>



          {!isMobile && (

            <div className="header-controls" style={navStyles.headerControls}>

              <div className="compact-pill" style={navStyles.compactPill}>

                <span style={navStyles.pillIcon}>🌐</span>

                <select

                  value={lang}

                  onChange={(e) => setLang(e.target.value)}

                  className="compact-select"

                  style={navStyles.compactSelect}

                  aria-label="Language"

                >

                  <option value="UR">UR</option>

                  <option value="EN">EN</option>

                  <option value="HI">HI</option>

                </select>

              </div>



              <div className="compact-pill" style={navStyles.compactPill}>

                <span style={navStyles.pillIcon}>💱</span>

                <select

                  value={currency}

                  onChange={(e) => setCurrency(e.target.value)}

                  className="compact-select"

                  style={navStyles.compactSelect}

                  aria-label="Currency"

                >

                  <option value="PKR">PKR</option>

                  <option value="INR">INR</option>

                  <option value="USD">USD</option>

                  <option value="EUR">EUR</option>

                </select>

              </div>

            </div>

          )}

        </div>



        {!isMobile ? (
          <div className="nav-links" style={navStyles.navLinks}>
            <button className={page === "home" ? "active" : ""} style={navStyles.navBtn} onClick={() => navigateToPage("home")}>
              {t.home}
            </button>
            <button className={page === "earn" ? "active" : ""} style={navStyles.navBtn} onClick={() => navigateToPage("earn")}>
              Arcade
            </button>

            {/* AdSense review safe: Gaming Arena, Winners and Lucky Draw are temporarily hidden. */}

            <div style={navStyles.dropdownContainer} onMouseLeave={() => setAboutDropdownOpen(false)}>
              <button
                style={{ ...navStyles.navBtn, display: "flex", alignItems: "center", gap: "4px" }}
                onClick={() => { setAboutDropdownOpen(!aboutDropdownOpen); setPlayDropdownOpen(false); setUserDropdownOpen(false); }}
              >
                More ▾
              </button>
              {aboutDropdownOpen && (
                <div style={navStyles.dropdownMenu}>
                  <button style={navStyles.dropdownItem} onClick={() => navigateToPage("wallet")}>💰 {t.wallet}</button>
                    {user?.role === "admin" && (
                      <button
                        style={{ ...navStyles.dropdownItem, color: "#7dd3fc", fontWeight: "800" }}
                        onClick={() => navigateToPage("adminDeposits")}
                      >
                        🛡️ Admin Deposits
                      </button>
                    )}
                  <button style={navStyles.dropdownItem} onClick={() => navigateToPage("privacy")}>🛡️ Privacy Policy</button>
                  <button style={navStyles.dropdownItem} onClick={() => navigateToPage("terms")}>📄 Terms & Conditions</button>
                  <button style={navStyles.dropdownItem} onClick={() => navigateToPage("refund")}>🔄 Refund Policy</button>
                </div>
              )}
            </div>

            {user ? (
              <div style={navStyles.dropdownContainer} onMouseLeave={() => setUserDropdownOpen(false)}>
                <button
                  style={navStyles.profileNavBtn}
                  onClick={() => { setUserDropdownOpen(!userDropdownOpen); setPlayDropdownOpen(false); setAboutDropdownOpen(false); }}
                  aria-label="Open profile menu"
                >
                  <span style={navStyles.profileAvatar}>
                    {(user.profilePic || user.profileImage || user.avatar) ? (
                      <img
                        src={user.profilePic || user.profileImage || user.avatar}
                        alt={user.name || "User"}
                        style={navStyles.profileAvatarImage}
                      />
                    ) : (
                      (user.name || "U").trim().charAt(0).toUpperCase()
                    )}
                  </span>
                  <span style={navStyles.profileNavName}>{user.name}</span>
                  <span style={navStyles.profileChevron}>▾</span>
                </button>
                {userDropdownOpen && (
                  <div style={{ ...navStyles.dropdownMenu, minWidth: "180px" }}>
                    <button style={navStyles.dropdownItem} onClick={() => navigateToPage("profile")}>👤 {t.profile}</button>
                    <button style={navStyles.dropdownItem} onClick={() => navigateToPage("wallet")}>💰 {t.wallet}</button>
                    <button style={{ ...navStyles.dropdownItem, color: "#fca5a5" }} onClick={handleLogout}>🚪 Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsLoginMode(false);
                  setShowAuthModal(true);
                }}
                style={navStyles.loginNavBtn}
              >
                Login / Signup
              </button>
            )}
          </div>
        ) : (
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            style={navStyles.menuToggle}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span style={navStyles.menuIcon}>{menuOpen ? "✕" : "☰"}</span>
          </button>
        )}
      </nav>



      {/* MOBILE MENU */}

      {menuOpen && isMobile && (

        <div className="mobile-menu" style={navStyles.mobileMenu}>

          <div style={navStyles.mobileMenuHeader}>

            <div>

              <div style={navStyles.mobileMenuTitle}>SAMATKAAR</div>

              <div style={navStyles.mobileMenuSub}>Navigation</div>

            </div>

            <button

              onClick={() => setMenuOpen(false)}

              style={navStyles.mobileCloseBtn}

              aria-label="Close menu"

            >

              ✕

            </button>

          </div>



          <div style={navStyles.mobileMenuGrid}>

            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("home")}>🏠 <span>{t.home}</span></button>

            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("earn")}>🎮 <span>Arcade</span></button>

            {/* AdSense review safe: Lucky Draw, Gaming Arena and Winners are temporarily hidden. */}

            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("wallet")}>💰 <span>{t.wallet}</span></button>

            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("profile")}>👤 <span>{t.profile}</span></button>
            {user?.role === "admin" && (
              <button
                style={{ ...navStyles.mobileMenuBtn, borderColor: "rgba(56,189,248,0.35)", color: "#7dd3fc" }}
                onClick={() => navigateToPage("adminDeposits")}
              >
                🛡️ <span>Admin Deposits</span>
              </button>
            )}

          </div>



          {/* Mobile Policies / About Us Section */}

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px", borderRadius: "6px" }}>

            <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px", fontWeight: "bold" }}>📁 About Us & Policies</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>

              <button style={navStyles.mobileMenuBtnFull} onClick={() => navigateToPage("privacy")}>🛡️ Privacy Policy</button>

              <button style={navStyles.mobileMenuBtnFull} onClick={() => navigateToPage("terms")}>📄 Terms & Conditions</button>

              <button style={navStyles.mobileMenuBtnFull} onClick={() => navigateToPage("refund")}>🔄 Refund Policy</button>

            </div>

          </div>



          <div style={navStyles.mobileSettings}>

            <div style={navStyles.mobileSettingItem}>

              <span>🌐 Language</span>

              <select

                value={lang}

                onChange={(e) => setLang(e.target.value)}

                style={navStyles.mobileSelect}

              >

                <option value="UR">UR</option>

                <option value="EN">EN</option>

                <option value="HI">HI</option>

              </select>

            </div>



            <div style={navStyles.mobileSettingItem}>

              <span>💱 Currency</span>

              <select

                value={currency}

                onChange={(e) => setCurrency(e.target.value)}

                style={navStyles.mobileSelect}

              >

                <option value="PKR">PKR</option>

                <option value="INR">INR</option>

                <option value="USD">USD</option>

                <option value="EUR">EUR</option>

              </select>

            </div>

          </div>



          {user ? (

            <button onClick={handleLogout} style={navStyles.mobileLogoutBtn}>

              🚪 Logout <span>({user.name})</span>

            </button>

          ) : (

            <button

              onClick={() => {

                setMenuOpen(false);

                setIsLoginMode(false);

                setShowAuthModal(true);

              }}

              style={navStyles.mobileLoginBtn}

            >

              🔑 Login / Signup

            </button>

          )}

        </div>

      )}



      {/* TOAST */}

      {message.text && (

        <div className={`toast-notification ${message.type}`}>

          {message.text}

        </div>

      )}



      <NotificationCenter
        user={user}
        navigateToPage={navigateToPage}
        triggerNotification={triggerNotification}
      />

      {/* PAGES ROUTING */}

      {page === "home" && (

        <main>

          <section className="hero">

            <div className="hero-content">

              <p className="small-title">{t.welcome}</p>

              <h1>{t.heroTitle1}<span>{t.heroTitle2}</span></h1>

              <p className="description">{t.heroSub}</p>

            </div>

          </section>



          <section className="balance-section">

            <div className="balance-card">

              <div>

                <p className="card-label">{t.yourBalance}</p>

                <h2>🪙 {coins.toLocaleString()} Coins</h2>

                <p className="usd">≈ {activeCurrency.symbol}{convertCoins(coins)} {currency}</p>

              </div>

              <div className="coin-icon">🪙</div>

            </div>

          </section>



          <section className="section">

            <div className="cards">

              <div className="action-card">

                <div className="card-icon">🎮</div>

                <h3>Arcade Games</h3>

                <p>Play simple browser games for entertainment while platform features are being reviewed.</p>

                <button className="primary-button" onClick={() => navigateToPage("earn")}>Open Arcade</button>

              </div>



              <div className="action-card">

                <div className="card-icon">🛡️</div>

                <h3>Platform Review Mode</h3>

                <p>Some reward and competition features are temporarily paused while the site is under AdSense review.</p>

                <button className="primary-button" onClick={() => navigateToPage("terms")}>Read Terms</button>

              </div>



              <div className="action-card">

                <div className="card-icon">📢</div>

                <h3>Updates Coming Soon</h3>

                <p>New safe features will be added after the review process is completed.</p>

                <button className="primary-button" onClick={() => navigateToPage("privacy")}>Privacy Policy</button>

              </div>

            </div>

          </section>



          {/* 🎁 INVITE BONUS SECTION */}

          <section

            style={{

              width: "100%",

              maxWidth: "1200px",

              margin: "0 auto",

              padding: "0 16px 32px",

              boxSizing: "border-box",

            }}

          >

            <InviteBonusSection />

          </section>

        </main>

      )}



      {page === "earn" && <Earn addCoins={addCoins} user={user} navigate={navigateToPage} />}



      {/* AdSense review safe: Lucky Draw, Gaming Arena and Winners pages are temporarily disabled. */}

      {page === "adminDeposits" && user?.role === "admin" && (
        <AdminDeposits
          user={user}
          navigate={navigateToPage}
        />
      )}



      {page === "wallet" && (

        <Wallet

          coins={coins}

          user={user}

          pendingPayments={pendingPayments}

          deductCoins={deductCoins}

          navigate={navigateToPage}

        />

      )}



      {page === "profile" && (

        <Profile

          user={user || { name: "Guest User", phone: "Not Logged In", coins: coins }}

          setUser={setUser}

          coins={coins}

          navigate={navigateToPage}

          onOpenAuth={() => setShowAuthModal(true)}

        />

      )}



      {page === "privacy" && <PrivacyPolicy navigate={navigateToPage} />}

      {page === "terms" && <Terms navigate={navigateToPage} />}

      {page === "refund" && <RefundPolicy navigate={navigateToPage} />}



      {/* PROFESSIONAL FULL-SCREEN SIGN UP / LOGIN EXPERIENCE */}

      {showAuthModal && (

        <div style={navStyles.authPageOverlay}>

          <style>{`@keyframes authButtonSpin { to { transform: rotate(360deg); } }`}</style>

          <div style={navStyles.authPageBackgroundGlow}></div>



          <div style={navStyles.authPageShell}>

            {/* LEFT BRAND / WELCOME PANEL */}

            <div

              style={{

                ...navStyles.authBrandPanel,

                ...(isMobile

                  ? {

                    padding: "30px 24px",

                    borderRight: "none",

                    borderBottom: "1px solid rgba(148,163,184,0.12)",

                  }

                  : {}),

              }}

            >

              <div style={navStyles.authBrandLogoWrap}>

                <div style={navStyles.authBrandLogoGlow}></div>

                <div style={navStyles.authBrandLogo}>S</div>

              </div>



              <div style={navStyles.authBrandName}>SAMATKAAR</div>

              <div style={navStyles.authBrandLine}></div>

              <h2 style={navStyles.authBrandHeading}>

                {isLoginMode ? "Welcome Back" : "Join SAMATKAAR"}

              </h2>

              <p style={navStyles.authBrandText}>

                {isLoginMode

                  ? "Apne account me securely login karein aur apna SAMATKAAR experience continue karein."

                  : "Apna account create karein aur SAMATKAAR ki tamam features ko access karein."}

              </p>



              <div style={navStyles.authFeatureList}>

                <div style={navStyles.authFeatureItem}>✓ Secure Account Access</div>

                <div style={navStyles.authFeatureItem}>✓ Fast & Simple Experience</div>

                <div style={navStyles.authFeatureItem}>✓ Your Coins Stay Synced</div>

              </div>

            </div>



            {/* RIGHT AUTH FORM PANEL */}

            <div

              style={{

                ...navStyles.authFormPanel,

                ...(isMobile

                  ? {

                    padding: "30px 24px",

                  }

                  : {}),

              }}

            >

              <div style={navStyles.authTopRow}>

                <div>

                  <div style={navStyles.authBadge}>

                    {isLoginMode ? "🔐 SECURE LOGIN" : "✨ CREATE ACCOUNT"}

                  </div>

                  <h1 style={navStyles.authTitle}>

                    {isLoginMode ? "Login" : "Create Account"}

                  </h1>

                  <p style={navStyles.authSubtitle}>

                    {isLoginMode

                      ? "Enter your registered details to continue."

                      : "Create your SAMATKAAR account in a few seconds."}

                  </p>

                </div>



                <button

                  type="button"

                  onClick={() => {

                    if (!isAuthLoading) setShowAuthModal(false);

                  }}

                  style={navStyles.authCloseBtn}

                  aria-label="Close authentication page"

                  disabled={isAuthLoading}

                >

                  ✕

                </button>

              </div>



              <form onSubmit={isLoginMode ? handleLoginSubmit : handleRegisterSubmit}>

                {!isLoginMode && (

                  <div style={navStyles.authFieldGroup}>

                    <label style={navStyles.authFieldLabel}>Full Name</label>

                    <div style={navStyles.authInputWrap}>

                      <span style={navStyles.authInputIcon}>👤</span>

                      <input

                        type="text"

                        placeholder="Enter your name"

                        value={inputName}

                        onChange={(e) => setInputName(e.target.value)}

                        style={navStyles.authInput}

                        disabled={isAuthLoading}

                        autoComplete="name"

                      />

                    </div>

                  </div>

                )}



                <div style={navStyles.authFieldGroup}>

                  <label style={navStyles.authFieldLabel}>Phone Number</label>

                  <div style={navStyles.authInputWrap}>

                    <span style={navStyles.authInputIcon}>📱</span>

                    <input

                      type="text"

                      placeholder="03001234567"

                      value={inputPhone}

                      onChange={(e) => setInputPhone(e.target.value)}

                      style={navStyles.authInput}

                      disabled={isAuthLoading}

                      autoComplete="tel"

                    />

                  </div>

                </div>



                <div style={navStyles.authFieldGroup}>

                  <label style={navStyles.authFieldLabel}>Password</label>

                  <div style={navStyles.authInputWrap}>

                    <span style={navStyles.authInputIcon}>🔒</span>

                    <input

                      type={showPassword ? "text" : "password"}

                      placeholder="Enter your password"

                      value={inputPassword}

                      onChange={(e) => setInputPassword(e.target.value)}

                      style={navStyles.authInputWithEye}

                      disabled={isAuthLoading}

                      autoComplete={isLoginMode ? "current-password" : "new-password"}

                    />

                    <button

                      type="button"

                      onClick={() => setShowPassword(!showPassword)}

                      style={navStyles.authEyeBtn}

                      disabled={isAuthLoading}

                      aria-label={showPassword ? "Hide password" : "Show password"}

                    >

                      {showPassword ? "👁️‍🗨️" : "👁️"}

                    </button>

                  </div>

                </div>



                {authError && (

                  <div style={navStyles.authErrorBox}>

                    <span>⚠️</span>

                    <span>{authError.replace(/^⚠️\s*/, "").replace(/^❌\s*/, "")}</span>

                  </div>

                )}



                {authSuccess && (

                  <div style={navStyles.authSuccessBox}>

                    <span>✓</span>

                    <span>{authSuccess.replace(/^✅\s*/, "")}</span>

                  </div>

                )}



                <button

                  type="submit"

                  style={{

                    ...navStyles.authSubmitBtn,

                    ...(isAuthLoading ? navStyles.authSubmitBtnLoading : {}),

                  }}

                  disabled={isAuthLoading}

                >

                  {isAuthLoading ? (

                    <>

                      <span style={navStyles.authSpinner}></span>

                      <span>{isLoginMode ? "Signing in..." : "Creating account..."}</span>

                    </>

                  ) : (

                    <>

                      <span>{isLoginMode ? "Login" : "Create Account"}</span>

                      <span style={navStyles.authSubmitArrow}>→</span>

                    </>

                  )}

                </button>

              </form>



              <div style={navStyles.authSwitchArea}>

                <span style={navStyles.authSwitchText}>

                  {isLoginMode ? "Don't have an account?" : "Already have an account?"}

                </span>

                <button

                  type="button"

                  onClick={() => {

                    if (isAuthLoading) return;

                    setIsLoginMode(!isLoginMode);

                    setAuthError("");

                    setAuthSuccess("");

                    setShowPassword(false);

                  }}

                  style={navStyles.authSwitchBtn}

                  disabled={isAuthLoading}

                >

                  {isLoginMode ? "Create Account" : "Login"}

                </button>

              </div>



              <div style={navStyles.authSecurityNote}>

                <span>🛡️</span>

                <span>Your account details are sent securely to SAMATKAAR.</span>

              </div>

            </div>

          </div>

        </div>

      )}





      {/* AdSense review safe: third-party ads, smartlinks and bonus reward links are temporarily disabled. */}
      <footer>

        <div className="footer-brand"><strong>SAMATKAAR</strong></div>

        <p>{t.footerSub}</p>

        <small>© 2026 SAMATKAAR. Official App Version</small>

      </footer>

    </div>

  );

}



// Complete responsive navigation & component inline styles helper

const getResponsiveNavStyles = (isMobile, isTablet) => {

  return {

    navbar: {

      display: "flex",

      justifyContent: "space-between",

      alignItems: "center",

      padding: "10px 16px",

      background: "#1e293b",

      borderBottom: "1px solid #334155",

      position: "sticky",

      top: 0,

      zIndex: 1000,

    },

    navLeftGroup: {

      display: "flex",

      alignItems: "center",

      gap: "12px",

    },

    brand: {

      display: "flex",

      alignItems: "center",

      gap: "8px",

      cursor: "pointer",

      fontWeight: "800",

      fontSize: "18px",

      color: "#38bdf8",

    },

    brandMark: {

      background: "#0284c7",

      color: "#fff",

      width: "28px",

      height: "28px",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      borderRadius: "6px",

      fontSize: "14px",

    },

    headerControls: {

      display: "flex",

      alignItems: "center",

      gap: "6px",

    },

    compactPill: {

      display: "flex",

      alignItems: "center",

      background: "rgba(255, 255, 255, 0.06)",

      borderRadius: "4px",

      padding: "2px 6px",

      border: "1px solid rgba(255, 255, 255, 0.1)",

    },

    pillIcon: {

      fontSize: "11px",

      marginRight: "4px",

    },

    compactSelect: {

      background: "transparent",

      border: "none",

      color: "#fff",

      fontSize: "11px",

      cursor: "pointer",

      outline: "none",

    },

    navLinks: {

      display: "flex",

      alignItems: "center",

      gap: "6px",

    },

    navBtn: {

      background: "transparent",

      border: "none",

      color: "#cbd5e1",

      fontSize: "12px",

      cursor: "pointer",

      padding: "6px 10px",

      borderRadius: "4px",

      fontWeight: "500",

    },

    gamingArenaNavBtn: {

      background: "linear-gradient(135deg, rgba(2,132,199,0.18), rgba(14,165,233,0.08))",

      border: "1px solid rgba(56,189,248,0.18)",

      color: "#7dd3fc",

      fontWeight: "700",

      boxShadow: "0 4px 14px rgba(14,165,233,0.08)",

    },

    dropdownContainer: {

      position: "relative",

      display: "inline-block",

    },

    dropdownMenu: {

      position: "absolute",

      right: 0,

      top: "100%",

      background: "#1e293b",

      border: "1px solid #334155",

      borderRadius: "6px",

      boxShadow: "0 10px 20px rgba(0,0,0,0.5)",

      display: "flex",

      flexDirection: "column",

      minWidth: "160px",

      zIndex: 1100,

      overflow: "hidden",

    },

    dropdownItem: {

      background: "transparent",

      border: "none",

      color: "#cbd5e1",

      padding: "10px 14px",

      textAlign: "left",

      fontSize: "12px",

      cursor: "pointer",

      fontWeight: "500",

      borderBottom: "1px solid rgba(255,255,255,0.05)",

    },

    loginNavBtn: {

      background: "#0284c7",

      color: "#fff",

      borderRadius: "5px",

      border: "none",

      padding: "6px 12px",

      cursor: "pointer",

      fontWeight: "600",

      fontSize: "11px",

    },

    userArea: {

      display: "flex",

      alignItems: "center",

      gap: "8px",

    },

    userName: {

      fontSize: "12px",

      color: "#38bdf8",

      fontWeight: "600",

    },

    logoutBtn: {

      background: "#ef4444",

      color: "#fff",

      borderRadius: "5px",

      border: "none",

      padding: "5px 10px",

      cursor: "pointer",

      fontWeight: "600",

      fontSize: "11px",

    },

    profileNavBtn: {
      display: "flex",
      alignItems: "center",
      gap: "7px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(148,163,184,0.16)",
      color: "#e2e8f0",
      borderRadius: "999px",
      padding: "4px 9px 4px 4px",
      cursor: "pointer",
      maxWidth: "150px",
    },

    profileAvatar: {
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      background: "linear-gradient(135deg, #0284c7, #38bdf8)",
      color: "#fff",
      fontSize: "13px",
      fontWeight: "800",
      border: "1px solid rgba(255,255,255,0.18)",
      boxShadow: "0 3px 10px rgba(14,165,233,0.18)",
    },

    profileAvatarImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },

    profileNavName: {
      fontSize: "11px",
      fontWeight: "700",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "82px",
    },

    profileChevron: {
      color: "#94a3b8",
      fontSize: "10px",
    },

    menuToggle: {

      background: "transparent",

      border: "none",

      color: "#fff",

      fontSize: "22px",

      cursor: "pointer",

      outline: "none",

    },

    menuIcon: {

      display: "inline-block",

    },

    mobileMenu: {

      display: "flex",

      flexDirection: "column",

      background: "#1e293b",

      padding: "16px",

      gap: "12px",

      borderBottom: "1px solid #334155",

      position: "fixed",
      top: "49px",

      left: 0,

      right: 0,

      zIndex: 1500,

      boxShadow: "0 10px 20px rgba(0,0,0,0.4)",

    },

    mobileMenuHeader: {

      display: "flex",

      justifyContent: "space-between",

      alignItems: "center",

      borderBottom: "1px solid #334155",

      paddingBottom: "10px",

    },

    mobileMenuTitle: {

      fontWeight: "800",

      fontSize: "16px",

      color: "#38bdf8",

    },

    mobileMenuSub: {

      fontSize: "11px",

      color: "#94a3b8",

    },

    mobileCloseBtn: {

      background: "transparent",

      border: "none",

      color: "#fff",

      fontSize: "18px",

      cursor: "pointer",

    },

    mobileMenuGrid: {

      display: "grid",

      gridTemplateColumns: "1fr 1fr",

      gap: "8px",

    },

    mobileMenuBtn: {

      background: "rgba(255, 255, 255, 0.05)",

      border: "1px solid rgba(255, 255, 255, 0.1)",

      color: "#fff",

      textAlign: "left",

      padding: "10px",

      fontSize: "12px",

      borderRadius: "6px",

      cursor: "pointer",

      display: "flex",

      alignItems: "center",

      gap: "8px",

    },

    gamingArenaMobileBtn: {

      background: "linear-gradient(135deg, rgba(2,132,199,0.24), rgba(14,165,233,0.10))",

      border: "1px solid rgba(56,189,248,0.24)",

      color: "#7dd3fc",

      fontWeight: "700",

      boxShadow: "0 5px 16px rgba(14,165,233,0.08)",

    },

    mobileMenuBtnFull: {

      background: "rgba(255, 255, 255, 0.05)",

      border: "1px solid rgba(255, 255, 255, 0.1)",

      color: "#fff",

      textAlign: "left",

      padding: "8px 10px",

      fontSize: "12px",

      borderRadius: "4px",

      cursor: "pointer",

      display: "flex",

      alignItems: "center",

      gap: "8px",

      width: "100%",

    },

    mobileSettings: {

      display: "flex",

      flexDirection: "column",

      gap: "8px",

      background: "rgba(0, 0, 0, 0.2)",

      padding: "10px",

      borderRadius: "6px",

    },

    mobileSettingItem: {

      display: "flex",

      justifyContent: "space-between",

      alignItems: "center",

      color: "#cbd5e1",

      fontSize: "12px",

    },

    mobileSelect: {

      background: "#0f172a",

      border: "1px solid #475569",

      color: "#fff",

      borderRadius: "4px",

      padding: "4px 8px",

      fontSize: "12px",

      outline: "none",

    },

    mobileLoginBtn: {

      background: "#0284c7",

      color: "#fff",

      border: "none",

      padding: "10px",

      borderRadius: "6px",

      fontWeight: "bold",

      fontSize: "13px",

      cursor: "pointer",

      textAlign: "center",

    },

    mobileLogoutBtn: {

      background: "#ef4444",

      color: "#fff",

      border: "none",

      padding: "10px",

      borderRadius: "6px",

      fontWeight: "bold",

      fontSize: "13px",

      cursor: "pointer",

      textAlign: "center",

    },

    // PROFESSIONAL FULL-SCREEN AUTH PAGE

    authPageOverlay: {

      position: "fixed",

      inset: 0,

      width: "100%",

      maxWidth: "100vw",

      height: isMobile ? "100dvh" : "100vh",

      minHeight: "100vh",

      background: "radial-gradient(circle at 20% 20%, #172554 0%, #0f172a 42%, #020617 100%)",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      padding: isMobile ? "10px" : "24px",

      boxSizing: "border-box",

      overflowX: "hidden",

      overflowY: "auto",

      zIndex: 99999,

      fontFamily: "inherit",

    },

    authPageBackgroundGlow: {

      position: "absolute",

      width: "420px",

      height: "420px",

      borderRadius: "50%",

      background: "rgba(14,165,233,0.13)",

      filter: "blur(90px)",

      pointerEvents: "none",

    },

    authPageShell: {

      position: "relative",

      zIndex: 2,

      width: isMobile ? "calc(100vw - 20px)" : "min(100%, 920px)",

      maxWidth: isMobile ? "430px" : "920px",

      minWidth: 0,

      minHeight: isMobile ? "auto" : "560px",

      display: "grid",

      gridTemplateColumns: isMobile ? "minmax(0, 1fr)" : "0.9fr 1.1fr",

      background: "rgba(15,23,42,0.94)",

      border: "1px solid rgba(148,163,184,0.16)",

      borderRadius: isMobile ? "18px" : "28px",

      overflowX: "hidden",

      overflowY: isMobile ? "auto" : "hidden",

      boxSizing: "border-box",

      boxShadow: "0 30px 90px rgba(0,0,0,0.55), 0 0 60px rgba(14,165,233,0.08)",

      backdropFilter: "blur(18px)",

    },

    authBrandPanel: {

      position: "relative",

      minWidth: 0,

      width: "100%",

      boxSizing: "border-box",

      display: "flex",

      flexDirection: "column",

      justifyContent: "center",

      padding: "48px 42px",

      background: "linear-gradient(145deg, rgba(2,132,199,0.22), rgba(15,23,42,0.12))",

      borderRight: "1px solid rgba(148,163,184,0.12)",

    },

    authBrandLogoWrap: {

      position: "relative",

      width: "76px",

      height: "76px",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      marginBottom: "22px",

    },

    authBrandLogoGlow: {

      position: "absolute",

      inset: "5px",

      borderRadius: "22px",

      background: "rgba(56,189,248,0.28)",

      filter: "blur(18px)",

    },

    authBrandLogo: {

      position: "relative",

      width: "68px",

      height: "68px",

      borderRadius: "20px",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      background: "linear-gradient(145deg, #0ea5e9, #0369a1)",

      color: "#fff",

      fontSize: "34px",

      fontWeight: "900",

      boxShadow: "0 15px 40px rgba(14,165,233,0.3), inset 0 1px 0 rgba(255,255,255,0.25)",

    },

    authBrandName: {

      color: "#f8fafc",

      fontSize: "26px",

      fontWeight: "900",

      letterSpacing: "5px",

    },

    authBrandLine: {

      width: "58px",

      height: "3px",

      borderRadius: "999px",

      background: "linear-gradient(90deg, #0284c7, #38bdf8)",

      margin: "18px 0 24px",

    },

    authBrandHeading: {

      margin: 0,

      color: "#fff",

      fontSize: "30px",

      fontWeight: "800",

      lineHeight: 1.15,

    },

    authBrandText: {

      margin: "14px 0 26px",

      color: "#94a3b8",

      fontSize: "14px",

      lineHeight: 1.7,

      maxWidth: "330px",

    },

    authFeatureList: {

      display: "flex",

      flexDirection: "column",

      gap: "11px",

    },

    authFeatureItem: {

      color: "#cbd5e1",

      fontSize: "12px",

      fontWeight: "600",

    },

    authFormPanel: {

      minWidth: 0,

      width: "100%",

      boxSizing: "border-box",

      display: "flex",

      flexDirection: "column",

      justifyContent: "center",

      padding: "46px 52px",

      background: "rgba(2,6,23,0.32)",

    },

    authTopRow: {

      display: "flex",

      justifyContent: "space-between",

      alignItems: "flex-start",

      gap: "20px",

      marginBottom: "28px",

    },

    authBadge: {

      display: "inline-flex",

      alignItems: "center",

      padding: "6px 10px",

      borderRadius: "999px",

      background: "rgba(14,165,233,0.1)",

      border: "1px solid rgba(56,189,248,0.2)",

      color: "#38bdf8",

      fontSize: "9px",

      fontWeight: "800",

      letterSpacing: "1.2px",

      marginBottom: "12px",

    },

    authTitle: {

      margin: 0,

      color: "#f8fafc",

      fontSize: "34px",

      fontWeight: "850",

      letterSpacing: "-0.7px",

    },

    authSubtitle: {

      margin: "8px 0 0",

      color: "#64748b",

      fontSize: "12px",

      lineHeight: 1.5,

    },

    authCloseBtn: {

      width: "36px",

      height: "36px",

      flexShrink: 0,

      borderRadius: "10px",

      border: "1px solid rgba(148,163,184,0.15)",

      background: "rgba(255,255,255,0.04)",

      color: "#94a3b8",

      fontSize: "16px",

      cursor: "pointer",

    },

    authFieldGroup: {

      marginBottom: "17px",

    },

    authFieldLabel: {

      display: "block",

      marginBottom: "7px",

      color: "#cbd5e1",

      fontSize: "11px",

      fontWeight: "700",

    },

    authInputWrap: {

      position: "relative",

      display: "flex",

      alignItems: "center",

      width: "100%",

    },

    authInputIcon: {

      position: "absolute",

      left: "13px",

      zIndex: 2,

      fontSize: "14px",

      opacity: 0.8,

    },

    authInput: {

      width: "100%",

      height: "48px",

      padding: "0 14px 0 42px",

      borderRadius: "12px",

      border: "1px solid #334155",

      background: "rgba(15,23,42,0.86)",

      color: "#fff",

      fontSize: "13px",

      outline: "none",

      boxSizing: "border-box",

    },

    authInputWithEye: {

      width: "100%",

      height: "48px",

      padding: "0 46px 0 42px",

      borderRadius: "12px",

      border: "1px solid #334155",

      background: "rgba(15,23,42,0.86)",

      color: "#fff",

      fontSize: "13px",

      outline: "none",

      boxSizing: "border-box",

    },

    authEyeBtn: {

      position: "absolute",

      right: "8px",

      width: "34px",

      height: "34px",

      border: "none",

      borderRadius: "8px",

      background: "transparent",

      color: "#94a3b8",

      cursor: "pointer",

      fontSize: "15px",

    },

    authErrorBox: {

      display: "flex",

      alignItems: "center",

      gap: "8px",

      background: "rgba(127,29,29,0.28)",

      border: "1px solid rgba(248,113,113,0.2)",

      color: "#fca5a5",

      padding: "10px 12px",

      borderRadius: "10px",

      marginBottom: "14px",

      fontSize: "11px",

      lineHeight: 1.45,

    },

    authSuccessBox: {

      display: "flex",

      alignItems: "center",

      gap: "8px",

      background: "rgba(20,83,45,0.28)",

      border: "1px solid rgba(74,222,128,0.2)",

      color: "#86efac",

      padding: "10px 12px",

      borderRadius: "10px",

      marginBottom: "14px",

      fontSize: "11px",

      lineHeight: 1.45,

    },

    authSubmitBtn: {

      width: "100%",

      height: "50px",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      gap: "10px",

      background: "linear-gradient(135deg, #0284c7, #0ea5e9)",

      color: "#fff",

      border: "none",

      borderRadius: "12px",

      fontWeight: "800",

      cursor: "pointer",

      fontSize: "13px",

      boxShadow: "0 10px 25px rgba(14,165,233,0.2)",

      transition: "transform 0.2s ease, opacity 0.2s ease",

    },

    authSubmitBtnLoading: {

      opacity: 0.8,

      cursor: "not-allowed",

    },

    authSpinner: {

      width: "17px",

      height: "17px",

      borderRadius: "50%",

      border: "2px solid rgba(255,255,255,0.35)",

      borderTopColor: "#fff",

      display: "inline-block",

      animation: "authButtonSpin 0.75s linear infinite",

    },

    authSubmitArrow: {

      fontSize: "18px",

      lineHeight: 1,

    },

    authSwitchArea: {

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      flexWrap: "wrap",

      gap: "5px",

      marginTop: "20px",

      fontSize: "11px",

    },

    authSwitchText: {

      color: "#64748b",

    },

    authSwitchBtn: {

      background: "transparent",

      border: "none",

      color: "#38bdf8",

      fontSize: "11px",

      fontWeight: "800",

      cursor: "pointer",

      padding: 0,

    },

    authSecurityNote: {

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      gap: "6px",

      marginTop: "22px",

      color: "#475569",

      fontSize: "9px",

      textAlign: "center",

      lineHeight: 1.4,

    },

    modalOverlay: {

      position: "fixed",

      top: 0, left: 0, right: 0, bottom: 0,

      background: "rgba(0, 0, 0, 0.8)",

      display: "flex",

      justifyContent: "center",

      alignItems: "center",

      zIndex: 2000,

    },

    modalCard: {

      background: "#1e293b",

      color: "#fff",

      padding: "24px",

      borderRadius: "12px",

      width: "90%",

      maxWidth: "380px",

      boxShadow: "0 15px 30px rgba(0,0,0,0.5)",

      border: "1px solid #334155",

      boxSizing: "border-box",

    },

    closeBtn: {

      background: "transparent",

      border: "none",

      color: "#94a3b8",

      fontSize: "18px",

      cursor: "pointer",

    },

    label: {

      display: "block",

      fontSize: "12px",

      marginBottom: "5px",

      color: "#cbd5e1",

      fontWeight: "600",

    },

    input: {

      width: "100%",

      padding: "10px 12px",

      borderRadius: "6px",

      border: "1px solid #475569",

      background: "#0f172a",

      color: "#fff",

      fontSize: "14px",

      outline: "none",

      boxSizing: "border-box",

    },

    submitBtn: {

      width: "100%",

      background: "#0284c7",

      color: "#fff",

      border: "none",

      padding: "11px",

      borderRadius: "6px",

      fontWeight: "bold",

      cursor: "pointer",

      fontSize: "14px",

    },

    switchTextBtn: {

      background: "transparent",

      border: "none",

      color: "#38bdf8",

      fontSize: "12px",

      cursor: "pointer",

      textDecoration: "underline",

    },

    errorBox: {

      background: "#7f1d1d",

      color: "#fca5a5",

      padding: "9px",

      borderRadius: "6px",

      marginBottom: "12px",

      fontSize: "12px",

    },

    successBox: {

      background: "#14532d",

      color: "#86efac",

      padding: "9px",

      borderRadius: "6px",

      marginBottom: "12px",

      fontSize: "12px",

    }

  };

};



export default function App() {

  const [isAppLoading, setIsAppLoading] = useState(true);



  useEffect(() => {

    // ✨ Professional app startup screen

    const timer = setTimeout(() => {

      setIsAppLoading(false);

    }, 1600);



    return () => clearTimeout(timer);

  }, []);



  if (isAppLoading) {

    return (

      <>

        <style>{`

          @keyframes samatkaarLoaderSpin {

            to { transform: rotate(360deg); }

          }



          @keyframes samatkaarLoaderPulse {

            0%, 100% { transform: scale(1); opacity: 0.85; }

            50% { transform: scale(1.06); opacity: 1; }

          }



          @keyframes samatkaarLoaderGlow {

            0%, 100% { opacity: 0.35; transform: scale(0.95); }

            50% { opacity: 0.75; transform: scale(1.08); }

          }



          @keyframes samatkaarLoaderProgress {

            0% { width: 0%; }

            70% { width: 72%; }

            100% { width: 100%; }

          }



          @keyframes samatkaarLoaderDots {

            0%, 20% { opacity: 0; }

            40% { opacity: 1; }

            80%, 100% { opacity: 0; }

          }

        `}</style>



        <div style={appLoaderStyles.container}>

          <div style={appLoaderStyles.backgroundGlow}></div>



          <div style={appLoaderStyles.loaderContent}>

            <div style={appLoaderStyles.logoWrapper}>

              <div style={appLoaderStyles.logoGlow}></div>

              <div style={appLoaderStyles.logoRing}></div>

              <div style={appLoaderStyles.logo}>

                S

              </div>

            </div>



            <div style={appLoaderStyles.brandName}>

              SAMATKAAR

            </div>



            <div style={appLoaderStyles.tagline}>

              YOUR EXPERIENCE IS LOADING

              <span style={appLoaderStyles.dots}>•••</span>

            </div>



            <div style={appLoaderStyles.progressTrack}>

              <div style={appLoaderStyles.progressBar}></div>

            </div>



            <div style={appLoaderStyles.loadingStatus}>

              <span style={appLoaderStyles.statusDot}></span>

              Preparing your experience

            </div>

          </div>



          <div style={appLoaderStyles.footerText}>

            Secure • Fast • Simple

          </div>

        </div>

      </>

    );

  }



  return (

    <LanguageProvider>

      <Router>

        <Routes>

          <Route path="/" element={<MainApp />} />

        </Routes>
</Router>

    </LanguageProvider>

  );

}



// ✨ PROFESSIONAL SAMATKAAR APP LOADER STYLES

const appLoaderStyles = {

  container: {

    position: "fixed",

    inset: 0,

    width: "100%",

    height: "100vh",

    minHeight: "100vh",

    background: "radial-gradient(circle at 50% 35%, #172554 0%, #0b1120 45%, #020617 100%)",

    color: "#fff",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    flexDirection: "column",

    overflow: "hidden",

    zIndex: 99999,

    fontFamily: "inherit",

  },



  backgroundGlow: {

    position: "absolute",

    width: "280px",

    height: "280px",

    borderRadius: "50%",

    background: "rgba(56, 189, 248, 0.16)",

    filter: "blur(70px)",

    animation: "samatkaarLoaderGlow 2.2s ease-in-out infinite",

    pointerEvents: "none",

  },



  loaderContent: {

    position: "relative",

    zIndex: 2,

    width: "min(88%, 360px)",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    textAlign: "center",

  },



  logoWrapper: {

    position: "relative",

    width: "96px",

    height: "96px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    marginBottom: "22px",

  },



  logoGlow: {

    position: "absolute",

    width: "82px",

    height: "82px",

    borderRadius: "26px",

    background: "rgba(56, 189, 248, 0.28)",

    filter: "blur(18px)",

    animation: "samatkaarLoaderGlow 1.8s ease-in-out infinite",

  },



  logoRing: {

    position: "absolute",

    width: "92px",

    height: "92px",

    borderRadius: "28px",

    border: "2px solid rgba(56, 189, 248, 0.18)",

    borderTopColor: "#38bdf8",

    borderRightColor: "rgba(56, 189, 248, 0.55)",

    animation: "samatkaarLoaderSpin 1.1s linear infinite",

  },



  logo: {

    position: "relative",

    width: "68px",

    height: "68px",

    borderRadius: "20px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    background: "linear-gradient(145deg, #0ea5e9, #0369a1)",

    border: "1px solid rgba(255,255,255,0.2)",

    boxShadow: "0 12px 35px rgba(14,165,233,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",

    fontSize: "36px",

    fontWeight: "900",

    letterSpacing: "-2px",

    animation: "samatkaarLoaderPulse 2s ease-in-out infinite",

  },



  brandName: {

    fontSize: "28px",

    fontWeight: "900",

    letterSpacing: "7px",

    marginLeft: "7px",

    color: "#f8fafc",

    textShadow: "0 0 24px rgba(56,189,248,0.25)",

  },



  tagline: {

    marginTop: "8px",

    color: "#64748b",

    fontSize: "9px",

    fontWeight: "700",

    letterSpacing: "2.2px",

  },



  dots: {

    display: "inline-block",

    marginLeft: "4px",

    color: "#38bdf8",

    animation: "samatkaarLoaderDots 1.2s ease-in-out infinite",

  },



  progressTrack: {

    width: "100%",

    height: "4px",

    marginTop: "30px",

    borderRadius: "999px",

    background: "rgba(148,163,184,0.14)",

    overflow: "hidden",

    boxShadow: "inset 0 0 8px rgba(0,0,0,0.25)",

  },



  progressBar: {

    height: "100%",

    width: "0%",

    borderRadius: "999px",

    background: "linear-gradient(90deg, #0284c7, #38bdf8, #7dd3fc)",

    boxShadow: "0 0 14px rgba(56,189,248,0.7)",

    animation: "samatkaarLoaderProgress 1.55s cubic-bezier(0.4, 0, 0.2, 1) forwards",

  },



  loadingStatus: {

    display: "flex",

    alignItems: "center",

    gap: "7px",

    marginTop: "13px",

    color: "#94a3b8",

    fontSize: "11px",

    fontWeight: "500",

  },



  statusDot: {

    width: "6px",

    height: "6px",

    borderRadius: "50%",

    background: "#38bdf8",

    boxShadow: "0 0 10px rgba(56,189,248,0.9)",

    animation: "samatkaarLoaderPulse 1.2s ease-in-out infinite",

  },



  footerText: {

    position: "absolute",

    bottom: "24px",

    color: "#475569",

    fontSize: "9px",

    letterSpacing: "1.5px",

    fontWeight: "600",

    zIndex: 2,

  },

};