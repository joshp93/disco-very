let recommendation = document.querySelector(".recommendation");
let dropZones = [...document.querySelector(".drop-zones").children];
let interested = document.querySelector(".interested");
let notInterested = document.querySelector(".not-interested");
let content = document.querySelector(".content");
let authorise = document.querySelector(".authorise");
let audio;
let playing = false;

if (window.location.href.includes("#access_token")) {
    authorise.classList.add("hidden");
    content.classList.remove("hidden");
    parseResponseURL(window.location.hash);
    window.history.pushState('disco-very', 'disco-very', window.location.origin);
} else {
    if (!sessionStorage.getItem("access_token")) {
        content.classList.add("hidden");
        authorise.classList.remove("hidden");
        let getStarted = document.querySelector(".get-started");
        getStarted.href = buildHref();
    } else {
        authorise.classList.add("hidden");
        addEventListeners();
        getRecommendations();
    }
}


function addEventListeners() {
    recommendation.addEventListener("dragstart", (e) => {
        e.dataTransfer.dropEffect = "move";
        e.dataTransfer.setData("songInfo", {
            track: recommendation.children[0].innerText,
            artists: recommendation.children[1],
            album: recommendation.children[2]
        });
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
        });
        dropZone.addEventListener("dragenter", (e) => {
            e.preventDefault();
            dropZone.classList.add("drag-over");
            const backgroundColor = getComputedStyle(dropZone).backgroundColor;
            dropZone.style.backgroundColor = backgroundColor.replace("0.2", "0.5");
        });
        dropZone.addEventListener("drop", (e) => {
            if (playing) {
                audio.pause();
                playing = false;
            }
            console.log(e.dataTransfer.getData("songInfo"), dropZone, "hehehehe");
        });
        [...dropZone.children].forEach(child => child.style.pointerEvents = "none");
    });
}

function resetDropZoneStyling(dropZone) {
    dropZone.classList.remove("drag-over");
    const backgroundColor = getComputedStyle(dropZone).backgroundColor;
    dropZone.style.backgroundColor = backgroundColor.replace("0.5", "0.2");
}

function buildHref() {
    return "https://accounts.spotify.com/authorize?" +
        `client_id=1a55f7a13b364a01b7677fb928e785fb&` +
        "response_type=token&" +
        `redirect_uri=http://localhost:${window.location.port}&` +
        `state=${this.generateState()}&` +
        `scope=user-read-email user-top-read`
}

function generateState() {
    let randomArray = new Uint32Array(10);
    randomArray = crypto.getRandomValues(randomArray);
    const state = "disco-very" + randomArray.join("");
    return state;
}

function parseResponseURL(hash) {
    const hashBits = hash.split("&");
    sessionStorage.setItem("access_token", hashBits[0].replace("#access_token=", ""));
    sessionStorage.setItem("token_type", hashBits[1].replace("token_type=", ""));
    sessionStorage.setItem("expires_in", hashBits[2].replace("expires_in=", ""));
    sessionStorage.setItem("state", hashBits[3].replace("state=", ""));
}

async function getRecommendations() {
    if (!sessionStorage.getItem("seeds")) {
        await fetch("https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=long_term", getHeaders())
            .then((response) => response.json()).then(data => {
                sessionStorage.setItem("seeds", JSON.stringify(data.items));
            });

    }
    const seeds = JSON.parse(sessionStorage.getItem("seeds")).map(s => s.id).join(",");
    fetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${seeds}&limit=1`, getHeaders())
        .then((response) => response.json()).then(data => {
            appendSongInfo(data.tracks[0].name);
            appendSongInfo(data.tracks[0].artists.map(a => a.name).join(", "));
            appendSongInfo(data.tracks[0].album.name);
            recommendation.addEventListener("mouseup", () => {
                if (playing) {
                    audio.pause();
                    playing = false;
                } else {
                    audio = new Audio(data.tracks[0].preview_url);
                    audio.play();
                    playing = true;
                }
            });
            fetch(`https://api.spotify.com/v1/albums/${data.tracks[0].album.id}`, getHeaders())
                .then(response => response.json()).then(data => {
                    recommendation.style.background = `url(${data.images[0].url})`;
                    recommendation.style.backgroundRepeat = "no-repeat";
                    recommendation.style.backgroundSize = "cover";
                });
        });
}

function appendSongInfo(songInfo) {
    let songInfoElement = document.createElement("div");
    songInfoElement.classList.add("song-info");
    songInfoElement.innerText = songInfo;
    recommendation.appendChild(songInfoElement);
}

function getHeaders() {
    return {
        headers: {
            "Authorization": "Bearer " + sessionStorage.getItem("access_token"),
            "Content-Type": "application/json"
        }
    }
}