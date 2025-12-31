const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw1rOBGVodrorbBVR4OsMoEK-iuyT68EUMNru-FsM2qPxfEZvRZPXlV0G5PKJkNWx0FsA/exec";
const GET_ITEMS_URL = `${WEB_APP_URL}?action=getItemList`;

// Elements
const stockForm = document.getElementById("stockForm");
const itemSelect = document.getElementById("itemSelect");
const newItemNameInput = document.getElementById("newItemName");
const toggleModeBtn = document.getElementById("toggleModeBtn");
const itemIdInput = document.getElementById("itemId");
const categoryInput = document.getElementById("category");
const unitInput = document.getElementById("unit");
const submitBtn = document.getElementById("submitBtn");
const messageContainer = document.getElementById("messageContainer");

// State
let isCustomMode = false;

// 1. Fetch Item List on Load
document.addEventListener("DOMContentLoaded", function () {
    loadItemList();
    setupEventListeners();
});

function loadItemList() {
    fetch(GET_ITEMS_URL)
        .then(res => res.json())
        .then(response => {
            if (response.status !== "success") {
                throw new Error("Backend error: " + (response.message || "Unknown error"));
            }

            const items = response.data;
            itemSelect.innerHTML = '<option value="" disabled selected>-- Select Item --</option>';

            items.forEach(item => {
                const option = document.createElement("option");
                option.value = item.itemId;
                option.textContent = item.itemName;
                option.dataset.category = item.category || "";
                option.dataset.unit = item.unit || "";
                itemSelect.appendChild(option);
            });
        })
        .catch(err => {
            console.error("Error loading items:", err);
            showMessage("Failed to load items. Please refresh.", "error");
        });
}

function setupEventListeners() {
    // Toggle Mode
    toggleModeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        toggleCustomMode();
    });

    // Handle Item Selection (Standard Mode)
    itemSelect.addEventListener("change", function () {
        if (!isCustomMode) {
            const selected = this.options[this.selectedIndex];
            itemIdInput.value = selected.value || "";
            categoryInput.value = selected.dataset.category || "";
            unitInput.value = selected.dataset.unit || "";
        }
    });

    // Handle Form Submission
    stockForm.addEventListener("submit", handleFormSubmit);
}

function toggleCustomMode() {
    isCustomMode = !isCustomMode;

    if (isCustomMode) {
        // Switch to Custom Mode
        itemSelect.classList.add("hidden");
        newItemNameInput.classList.remove("hidden");
        toggleModeBtn.textContent = "Select Existing Item";

        // Enable editing for Category and Unit
        categoryInput.removeAttribute("readonly");
        unitInput.removeAttribute("readonly");
        categoryInput.classList.add("editable-highlight");
        unitInput.classList.add("editable-highlight");

        // Update Requirements
        itemSelect.removeAttribute("required");
        newItemNameInput.setAttribute("required", "true");
        categoryInput.setAttribute("required", "true"); // Typically needed for new items
        unitInput.setAttribute("required", "true");

        // Clear values
        clearInputs();
        itemIdInput.value = "CUSTOM"; // Marker for backend
    } else {
        // Switch back to Standard Mode
        itemSelect.classList.remove("hidden");
        newItemNameInput.classList.add("hidden");
        toggleModeBtn.textContent = "Add New Item";

        // Disable editing
        categoryInput.setAttribute("readonly", "true");
        unitInput.setAttribute("readonly", "true");
        categoryInput.classList.remove("editable-highlight");
        unitInput.classList.remove("editable-highlight");

        // Update Requirements
        itemSelect.setAttribute("required", "true");
        newItemNameInput.removeAttribute("required");
        categoryInput.removeAttribute("required"); // Auto-filled, so implicit
        unitInput.removeAttribute("required");

        // Reset inputs
        clearInputs();
        itemSelect.value = "";
    }
}

function clearInputs() {
    newItemNameInput.value = "";
    itemIdInput.value = "";
    categoryInput.value = "";
    unitInput.value = "";
}

async function handleFormSubmit(e) {
    e.preventDefault();

    setLoading(true);
    hideMessage();

    // Prepare Data
    let itemNameValue;
    let itemIdValue;

    if (isCustomMode) {
        itemNameValue = newItemNameInput.value.trim();
        itemIdValue = "CUSTOM"; // Or let backend assign specific ID
    } else {
        const selectedOption = itemSelect.options[itemSelect.selectedIndex];
        itemNameValue = selectedOption ? selectedOption.text : "";
        itemIdValue = itemIdInput.value;
    }

    const formData = {
        date: document.getElementById("date").value,
        itemId: itemIdValue,
        itemName: itemNameValue,
        category: categoryInput.value.trim(),
        bonNo: document.getElementById("bonNo").value,
        source: document.getElementById("source").value,
        masuk: document.getElementById("masuk").value,
        keluar: document.getElementById("keluar").value,
        unit: unitInput.value.trim()
    };

    const params = new URLSearchParams(formData);
    console.log("Submitting Payload:", formData); // Debug log

    try {
        await fetch(WEB_APP_URL, {
            method: "POST",
            mode: "no-cors", // Revert to no-cors for GAS compatibility
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString()
        });

        // With no-cors, we can't check response.ok or response.json()
        // We assume success if the fetch promise resolves.
        console.log("Request sent (opaque response)");

        // Success Handling
        showMessage("Stock entry submitted successfully!", "success");
        stockForm.reset();

        // Reset state after success
        if (isCustomMode) {
            toggleCustomMode();
        } else {
            clearInputs();
            itemSelect.value = "";
        }

    } catch (error) {
        console.error("Submission error:", error);
        showMessage("Failed to submit: " + error.message, "error");
    } finally {
        setLoading(false);
    }
}

// Helpers
function showMessage(text, type) {
    messageContainer.textContent = text;
    messageContainer.className = `message-container ${type}`;
    messageContainer.style.display = "block";
}

function hideMessage() {
    messageContainer.style.display = "none";
}

function setLoading(loading) {
    if (loading) {
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
    } else {
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Entry";
    }
}
