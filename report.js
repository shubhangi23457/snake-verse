// ============================================================
// SnakeVerse — Report a Snake form validation (report.html)
// No backend: on valid submit we just show a success message.
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reportForm");
    if (!form) return;

    const fileDrop = document.getElementById("fileDrop");
    const fileInput = document.getElementById("rImage");
    const filePreview = document.getElementById("filePreview");
    const successBox = document.getElementById("reportSuccess");

    // ---------- file picker / drag & drop ----------
    fileDrop.addEventListener("click", () => fileInput.click());

    ["dragover", "dragenter"].forEach(evt => {
        fileDrop.addEventListener(evt, (e) => {
            e.preventDefault();
            fileDrop.classList.add("drag");
        });
    });
    ["dragleave", "drop"].forEach(evt => {
        fileDrop.addEventListener(evt, (e) => {
            e.preventDefault();
            fileDrop.classList.remove("drag");
        });
    });
    fileDrop.addEventListener("drop", (e) => {
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFile();
        }
    });
    fileInput.addEventListener("change", handleFile);

    function handleFile() {
        const errBox = document.getElementById("err-rImage");
        errBox.textContent = "";
        const file = fileInput.files[0];
        if (!file) { filePreview.style.display = "none"; return; }

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            errBox.textContent = "Please choose a JPG, PNG, or WEBP image.";
            fileInput.value = "";
            filePreview.style.display = "none";
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            errBox.textContent = "Image must be smaller than 5MB.";
            fileInput.value = "";
            filePreview.style.display = "none";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            filePreview.src = e.target.result;
            filePreview.style.display = "block";
        };
        reader.readAsDataURL(file);
        fileDrop.textContent = file.name;
    }

    // ---------- field validation ----------
    const rules = {
        rName: v => v.trim().length >= 2 ? "" : "Please enter your name (2+ characters).",
        rEmail: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Please enter a valid email address.",
        rLocation: v => v.trim().length >= 3 ? "" : "Please describe the sighting location.",
        rType: v => v ? "" : "Please choose a snake type.",
        rDesc: v => v.trim().length >= 10 ? "" : "Please add a bit more detail (10+ characters).",
    };

    function validateField(id) {
        const el = document.getElementById(id);
        const errBox = document.getElementById("err-" + id);
        const message = rules[id](el.value);
        el.classList.toggle("invalid", !!message);
        errBox.textContent = message;
        return !message;
    }

    Object.keys(rules).forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener("blur", () => validateField(id));
        el.addEventListener("input", () => {
            if (el.classList.contains("invalid")) validateField(id);
        });
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        successBox.style.display = "none";

        let allValid = true;
        Object.keys(rules).forEach(id => {
            if (!validateField(id)) allValid = false;
        });

        if (!allValid) {
            const firstInvalid = form.querySelector(".invalid");
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        successBox.style.display = "block";
        form.reset();
        filePreview.style.display = "none";
        fileDrop.textContent = "Click to choose an image, or drag one here (JPG / PNG, max 5MB)";
        Object.keys(rules).forEach(id => document.getElementById(id).classList.remove("invalid"));
        successBox.scrollIntoView({ behavior: "smooth", block: "center" });
    });
});
