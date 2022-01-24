let recommendation = document.querySelector(".recommendation");
let dropZones = [...document.querySelector(".drop-zones").children];
let interested = document.querySelector(".interested");
let notInterested = document.querySelector(".not-interested");
let content = document.querySelector(".content");
let authorise = document.querySelector(".authorise");
let audio;

if (window.location.href.includes("#access_token")) {
    authorise.classList.add("hidden");
    content.classList.remove("hidden");
    parseResponseURL(window.location.hash);
    window.history.pushState('disco-very', 'disco-very', window.location.origin + "/disco-very/");
} else {
    if (!sessionStorage.getItem("access_token")) {
        content.classList.add("hidden");
        authorise.classList.remove("hidden");
        let getStarted = document.querySelector(".get-started");
        getStarted.href = buildHref();
    } else {
        authorise.classList.add("hidden");
        addDragEventListeners();
        getRecommendations();
    }
}


function addDragEventListeners() {
    recommendation.addEventListener("dragstart", (e) => {
        e.dataTransfer.dropEffect = "move";
        e.dataTransfer.setData("text/plain", recommendation.id);
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
            const data = e.dataTransfer.getData("text");
            if (dropZone.id === "interested") {
                let seeds = JSON.parse(sessionStorage.getItem("seeds"));
                seeds.unshift(data);
                seeds.splice(seeds.length - 1, 1);
                sessionStorage.setItem("seeds", JSON.stringify(seeds));
                getRecommendations();
            } else {
                getRecommendations();
            }
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
        `redirect_uri=${window.location.href}&` +
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
    setExpiresInDate();
}

async function getRecommendations() {
    if (validateAccessToken()) {
        return;
    }
    if (!sessionStorage.getItem("seeds")) {
        await fetch("https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=long_term", getHeaders())
            .then((response) => response.json()).then(data => {
                console.log(data);
                sessionStorage.setItem("seeds", JSON.stringify(data.items.map(item => item.id)));
            });
    }
    const seeds = JSON.parse(sessionStorage.getItem("seeds")).join(",");
    fetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${seeds}&limit=1`, getHeaders())
        .then((response) => response.json()).then(data => {
            removeOldSongInfoNodes();
            appendSongInfo(data.tracks[0].name);
            appendSongInfo(data.tracks[0].artists.map(a => a.name).join(", "));
            appendSongInfo(data.tracks[0].album.name);
            recommendation.id = data.tracks[0].id;
            if (audio && isPlayingAudio()) {
                audio.pause();
                audio.currentTime = 0;
            }
            audio = new Audio(data.tracks[0].preview_url);
            recommendation.addEventListener("mouseup", () => {
                if (!isPlayingAudio()) {
                    audio.play();
                } else {
                    audio.pause();
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

const isPlayingAudio = () => audio.currentTime > 0 && !audio.paused && !audio.ended && audio.readyState > audio.HAVE_CURRENT_DATA;

function removeOldSongInfoNodes() {
    const oldsongInfoElements = document.getElementsByClassName("song-info");
    while (oldsongInfoElements.length > 0) {
        oldsongInfoElements[0].parentElement.removeChild(oldsongInfoElements[0]);
    }
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

function setExpiresInDate() {
    let expiresIn = new Date();
    expiresIn.setSeconds(expiresIn.getSeconds() + parseInt(sessionStorage.getItem("expires_in")));
    sessionStorage.setItem("expiration_date", JSON.stringify(expiresIn));
}

function validateAccessToken() {
    const expiresIn = new Date(JSON.parse(sessionStorage.getItem("expiration_date")));
    if (expiresIn <= new Date()) {
        sessionStorage.clear();
        window.location.reload();
        return true;
    }
    return false;
}