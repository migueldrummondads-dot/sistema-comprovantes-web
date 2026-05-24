// ─────────────────────────────────────────────────────────────
//  chips.js — Seleção e gerenciamento dos chips de sintomas
// ─────────────────────────────────────────────────────────────

const selectedChips = new Set();

function initChips() {
    document.querySelectorAll(".chip").forEach((chip) => {
        chip.addEventListener("click", () => toggleChip(chip));
    });
}

function toggleChip(el) {
    const symptom = el.dataset.symptom;
    if (selectedChips.has(symptom)) {
        selectedChips.delete(symptom);
        el.classList.remove("selected");
    } else {
        selectedChips.add(symptom);
        el.classList.add("selected");
    }
    updateChipsDisplay();
}

function updateChipsDisplay() {
    const display = document.getElementById("chips-display");
    if (display) display.value = [...selectedChips].join(", ") || "";

    const pillsEl = document.getElementById("selected-display");
    const textEl = document.getElementById("chips-display-text");
    if (pillsEl && textEl) {
        pillsEl.style.display = selectedChips.size > 0 ? "block" : "none";
        textEl.textContent = [...selectedChips].join(", ");
    }
}

function getSelectedChips() {
    return [...selectedChips];
}

function clearChips() {
    selectedChips.clear();
    document.querySelectorAll(".chip.selected").forEach((c) =>
        c.classList.remove("selected")
    );
    updateChipsDisplay();
}