document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function setMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    window.clearTimeout(setMessage.timeoutId);
    setMessage.timeoutId = window.setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = Math.max(0, (details.max_participants || 0) - participants.length);
        const participantItems = participants.length
          ? participants
              .map(
                (participant) => `
                  <li class="participant-chip">
                    <span>${participant}</span>
                    <button
                      type="button"
                      class="participant-remove"
                      data-activity-name="${name}"
                      data-email="${participant}"
                      aria-label="Remove ${participant}"
                      title="Remove ${participant}"
                    >
                      ×
                    </button>
                  </li>
                `
              )
              .join("")
          : '<li class="empty">No participants yet</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants</strong>
            <ul class="participants-list">${participantItems}</ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message, "success");
        await fetchActivities();
      } else {
        setMessage(result.detail || "Unable to remove participant.", "error");
      }
    } catch (error) {
      setMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  }

  activitiesList.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".participant-remove");
    if (!removeButton) {
      return;
    }

    event.preventDefault();
    unregisterParticipant(removeButton.dataset.activityName, removeButton.dataset.email);
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        setMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      setMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});
