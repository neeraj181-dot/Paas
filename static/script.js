(function () {
  "use strict";

  const REFRESH_INTERVAL = 5000;

  const $ = (sel) => document.querySelector(sel);

  const deployForm = $("#deployForm");
  const deployBtn = $("#deployBtn");
  const deployMessage = $("#deployMessage");
  const appsGrid = $("#appsGrid");
  const appsLoading = $("#appsLoading");
  const appsError = $("#appsError");
  const appsErrorText = $("#appsErrorText");
  const appsEmpty = $("#appsEmpty");
  const refreshBtn = $("#refreshBtn");
  const retryBtn = $("#retryBtn");
  const connectionDot = $("#connectionDot");
  const connectionText = $("#connectionText");
  const toastContainer = $("#toastContainer");

  let refreshTimer = null;
  let isFetchingApps = false;
  let isFirstLoad = true;

  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      toast.style.transition = "opacity 0.3s, transform 0.3s";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function setConnectionStatus(connected) {
    connectionDot.className = "status-dot";
    if (connected) {
      connectionDot.classList.add("status-dot--connected");
      connectionText.textContent = "Connected";
    } else {
      connectionDot.classList.add("status-dot--error");
      connectionText.textContent = "Disconnected";
    }
  }

  function showDeployMessage(message, type) {
    deployMessage.hidden = false;
    deployMessage.textContent = message;
    deployMessage.className = `form-message form-message--${type}`;
  }

  function hideDeployMessage() {
    deployMessage.hidden = true;
    deployMessage.textContent = "";
    deployMessage.className = "form-message";
  }

  function setDeployLoading(loading) {
    deployBtn.disabled = loading;
    deployBtn.classList.toggle("btn--loading", loading);
    deployBtn.querySelector(".btn__spinner").hidden = !loading;
  }

  function statusBadgeClass(status) {
    const normalized = (status || "unknown").toLowerCase();
    if (normalized === "running") return "badge--running";
    return `badge--${normalized}`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderAppCard(app) {
    const card = document.createElement("article");
    card.className = "app-card";
    card.dataset.name = app.name;

    card.innerHTML = `
      <div class="app-card__header">
        <h3 class="app-card__name">${escapeHtml(app.name)}</h3>
        <span class="badge ${statusBadgeClass(app.status)}">${escapeHtml(app.status)}</span>
      </div>
      <div class="app-card__details">
        <div class="app-card__row">
          <span class="app-card__label">Container ID</span>
          <span class="app-card__value">${escapeHtml(app.id)}</span>
        </div>
        <div class="app-card__row">
          <span class="app-card__label">Status</span>
          <span class="app-card__value">${escapeHtml(app.status)}</span>
        </div>
      </div>
      <div class="app-card__footer">
        <button type="button" class="btn btn--danger" data-delete="${escapeHtml(app.name)}">
          Delete
        </button>
      </div>
    `;

    card.querySelector("[data-delete]").addEventListener("click", () => deleteApp(app.name));
    return card;
  }

  function showAppsState(state) {
    appsLoading.hidden = state !== "loading";
    appsError.hidden = state !== "error";
    appsEmpty.hidden = state !== "empty";
    appsGrid.hidden = state !== "grid";
  }

  function renderApps(apps) {
    appsGrid.innerHTML = "";

    if (!apps || apps.length === 0) {
      showAppsState("empty");
      return;
    }

    apps.forEach((app) => appsGrid.appendChild(renderAppCard(app)));
    showAppsState("grid");
  }

  async function fetchApps(silent = false) {
    if (isFetchingApps) return;
    isFetchingApps = true;

    if (isFirstLoad) {
      showAppsState("loading");
    }

    try {
      const response = await fetch("/apps");

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const apps = await response.json();
      renderApps(apps);
      setConnectionStatus(true);

      if (isFirstLoad) {
        isFirstLoad = false;
      }
    } catch (err) {
      setConnectionStatus(false);

      if (isFirstLoad || !silent) {
        appsErrorText.textContent = err.message || "Failed to load applications";
        showAppsState("error");
      }
    } finally {
      isFetchingApps = false;
    }
  }

  async function deployApp(appName, port) {
    hideDeployMessage();
    setDeployLoading(true);

    try {
      const response = await fetch("/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_name: appName, port: port }),
      });

      const data = await response.json();

      if (data.status === "success") {
        showDeployMessage(`Successfully deployed "${data.name}" on port ${data.port}`, "success");
        showToast(`Deployed ${data.name} on port ${data.port}`, "success");
        deployForm.reset();
        await fetchApps(true);
      } else {
        const msg = data.message || "Deployment failed";
        showDeployMessage(msg, "error");
        showToast(msg, "error");
      }
    } catch (err) {
      const msg = err.message || "Network error during deployment";
      showDeployMessage(msg, "error");
      showToast(msg, "error");
    } finally {
      setDeployLoading(false);
    }
  }

  async function deleteApp(name) {
    if (!confirm(`Delete application "${name}"? This will stop and remove the container.`)) {
      return;
    }

    const card = appsGrid.querySelector(`[data-name="${CSS.escape(name)}"]`);
    const deleteBtn = card?.querySelector("[data-delete]");
    if (deleteBtn) deleteBtn.disabled = true;

    try {
      const response = await fetch(`/apps/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.status === "success") {
        showToast(data.message || `${name} deleted`, "success");
        await fetchApps(true);
      } else {
        const msg = data.message || "Delete failed";
        showToast(msg, "error");
        if (deleteBtn) deleteBtn.disabled = false;
      }
    } catch (err) {
      showToast(err.message || "Network error during delete", "error");
      if (deleteBtn) deleteBtn.disabled = false;
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(() => fetchApps(true), REFRESH_INTERVAL);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  deployForm.addEventListener("submit", (e) => {
    e.preventDefault();
    hideDeployMessage();

    const appName = $("#appName").value.trim();
    const port = parseInt($("#port").value, 10);

    if (!appName) {
      showDeployMessage("App name is required", "error");
      return;
    }

    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(appName)) {
      showDeployMessage("Invalid app name. Use letters, numbers, hyphens, or underscores.", "error");
      return;
    }

    if (!port || port < 1 || port > 65535) {
      showDeployMessage("Port must be between 1 and 65535", "error");
      return;
    }

    deployApp(appName, port);
  });

  refreshBtn.addEventListener("click", () => fetchApps());
  retryBtn.addEventListener("click", () => fetchApps());

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoRefresh();
    } else {
      fetchApps(true);
      startAutoRefresh();
    }
  });

  fetchApps();
  startAutoRefresh();
})();
