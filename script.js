const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw1rOBGVodrorbBVR4OsMoEK-iuyT68EUMNru-FsM2qPxfEZvRZPXlV0G5PKJkNWx0FsA/exec";

// Elements
const stockForm = document.getElementById("stockForm");
const itemSelect = document.getElementById("itemSelect");
const itemIdInput = document.getElementById("itemId");
const categoryInput = document.getElementById("category");
const unitInput = document.getElementById("unit");
const submitBtn = document.getElementById("submitBtn");
const messageContainer = document.getElementById("messageContainer");

// 1. Fetch Item List on Load
document.addEventListener("DOMContentLoaded", loadItemList);

function loadItemList() {
    fetch(`${WEB_APP_URL}?action=getItemList`)
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

// 2. Handle Item Selection
itemSelect.addEventListener("change", function () {
    const selected = this.options[this.selectedIndex];
    itemIdInput.value = selected.value || "";
    categoryInput.value = selected.dataset.category || "";
    unitInput.value = selected.dataset.unit || "";
});

// 3. Handle Form Submission
stockForm.addEventListener("submit", function (e) {
    e.preventDefault();

    setLoading(true);
    hideMessage();

    const selectedOption = itemSelect.options[itemSelect.selectedIndex];
    const formData = {
        date: document.getElementById("date").value,
        itemId: itemIdInput.value,
        itemName: selectedOption ? selectedOption.text : "",
        category: categoryInput.value,
        bonNo: document.getElementById("bonNo").value,
        source: document.getElementById("source").value,
        masuk: document.getElementById("masuk").value,
        keluar: document.getElementById("keluar").value,
        unit: unitInput.value
    };

    const params = new URLSearchParams(formData);

    fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString()
    })
        .then(() => {
            showMessage("Stock entry submitted successfully!", "success");
            stockForm.reset();
            itemIdInput.value = "";
            categoryInput.value = "";
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
