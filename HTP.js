document.addEventListener("DOMContentLoaded", () => {
    const singleTab = document.getElementById("tab-single");
    const multiTab = document.getElementById("tab-multi");
    const singleSection = document.getElementById("single-section");
    const multiSection = document.getElementById("multi-section");

    function showTab(isSingle) {
        if (isSingle) { 
            singleTab.classList.add("active");
            multiTab.classList.remove("active");
            singleSection.classList.add("active");
            multiSection.classList.remove("active");
        } else {
            singleTab.classList.remove("active");
            multiTab.classList.add("active");
            singleSection.classList.remove("active");
            multiSection.classList.add("active");
        }
    }

    singleTab.addEventListener("click", () => showTab(true));
    multiTab.addEventListener("click", () => showTab(false));
});
