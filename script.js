const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw1rOBGVodrorbBVR4OsMoEK-iuyT68EUMNru-FsM2qPxfEZvRZPXlV0G5PKJkNWx0FsA/exec";

const stockForm = document.getElementById("stockForm");
const itemSelect = document.getElementById("itemSelect");
const itemIdInput = document.getElementById("itemId");
const unitInput = document.getElementById("unit");
const submitBtn = document.getElementById("submitBtn");
const messageContainer = document.getElementById("messageContainer");

// 1. Fetch Item List
function fetchItems() {
    fetch(https://script.google.com/macros/s/AKfycbw1rOBGVodrorbBVR4OsMoEK-iuyT68EUMNru-FsM2qPxfEZvRZPXlV0G5PKJkNWx0FsA/exec + "?action=getItemList")
        .then(res => res.json())
        .then(items => {
            itemSelect.innerHTML = '<option value="" disabled selected>-- Select Item --</option>';
            items.forEach(item => {
                const option = document.createElement("option");
                option.value = item.itemId;
                option.textContent = item.itemName;
                option.dataset.unit = item.unit;
                itemSelect.appendChild(option);
            });
        })
        .catch(err => {
            console.error("Error fetching items:", err);
            showMessage("Failed to load items. Please refresh.", "error");
        });
}

// 2. Handle Item Selection
itemSelect.addEventListener("change", function () {
    const selected = this.options[this.selectedIndex];
    itemIdInput.value = this.value;
    unitInput.value = selected.dataset.unit || "";
});

// 3. Handle Form Submission
stockForm.addEventListener("submit", function (e) {
    e.preventDefault();

    setLoading(true);
    hideMessage();

    const formData = {
        date: document.getElementById("date").value,
        itemId: itemIdInput.value,
        itemName: itemSelect.options[itemSelect.selectedIndex].text,
        bonNo: document.getElementById("bonNo").value,
        source: document.getElementById("source").value,
        masuk: document.getElementById("masuk").value,
        keluar: document.getElementById("keluar").value,
        unit: unitInput.value
    };

    // Google Apps Script usually handles parameters in GET or JSON in POST
    // Here we use query string for simplicity if your GAS supports it, 
    // or you can use standard POST. Let's try POST with URLSearchParams.

    const params = new URLSearchParams(formData);

    fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors", // Required for many GAS setups
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString()
    })
        .then(response => {
            // With no-cors, we can't see the response content, 
            // but we can assume success if no error is thrown
            showMessage("Stock entry submitted successfully!", "success");
            stockForm.reset();
            itemIdInput.value = "";
            unitInput.value = "";
        })
        .catch(error => {
            console.error("Submission error:", error);
            showMessage("Failed to submit. Please try again.", "error");
        })
        .finally(() => {
            setLoading(false);
        });
});

// Helper: Show Message
function showMessage(text, type) {
    messageContainer.textContent = text;
    messageContainer.className = `message-container ${type}`;
}

// Helper: Hide Message
function hideMessage() {
    messageContainer.style.display = "none";
}

// Helper: Set Loading State
function setLoading(loading) {
    if (loading) {
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;
    } else {
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
    }
}

// Initialize
fetchItems();
