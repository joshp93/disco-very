let recommendation = document.querySelector(".recommendation");
let dropZones = [...document.querySelector(".drop-zones").children];
let interested = document.querySelector(".interested");
let notInterested = document.querySelector(".not-interested");


recommendation.addEventListener("dragstart", (e) => {
    e.dataTransfer.dropEffect = "move";
    e.dataTransfer.setData("songInfo", "Brian")
    setTimeout(() => recommendation.classList.add("dragging"), 0);
});
recommendation.addEventListener("dragend", () => {
    recommendation.classList.remove("dragging");
    dropZones.forEach(dropZone => resetDropZoneStyling(dropZone));
});

dropZones.forEach(dropZone => {
    dropZone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        resetDropZoneStyling(dropZone);
        console.log("I left", dropZone);
    });
    dropZone.addEventListener("dragenter", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
        const backgroundColor = getComputedStyle(dropZone).backgroundColor;
        dropZone.style.backgroundColor = backgroundColor.replace("0.2", "0.5");
        console.log("I entered", dropZone);
    });
    dropZone.addEventListener("drop", (e) => {
        console.log(e.dataTransfer.getData("songInfo"), dropZone, "hehehehe");
    });
    [...dropZone.children].forEach(child => child.style.pointerEvents = "none");
});

function resetDropZoneStyling(dropZone) {
    dropZone.classList.remove("drag-over");
    const backgroundColor = getComputedStyle(dropZone).backgroundColor;
    dropZone.style.backgroundColor = backgroundColor.replace("0.5", "0.2");
}
