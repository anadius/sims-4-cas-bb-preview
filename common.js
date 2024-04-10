// https://stackoverflow.com/a/51086893
function Mutex() {
  let current = Promise.resolve();
  this.lock = () => {
    let _resolve;
    const p = new Promise(resolve => {
        _resolve = () => resolve();
    });
    // Caller gets a promise that resolves when the current outstanding
    // lock resolves
    const rv = current.then(() => _resolve);
    // Don't allow the next request until the new promise is done
    current = p;
    // Return the new promise
    return rv;
  };
}

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

async function blobToCanvas(blob, canvas) {
  if(typeof canvas === "undefined") {
    canvas = document.createElement("canvas");
  }
  const ctx = canvas.getContext("2d");
  const bitmap = await createImageBitmap(blob);
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  ctx.drawImage(bitmap, 0, 0);

  return [canvas, ctx];
}

async function loadImage(canvas, loaded) {
  const response = await fetch(canvas.url);
  const blob = await response.blob();

  // image loaded, you can start loading another one!
  loaded(canvas);

  const [colorImage, colorCtx] = await blobToCanvas(blob, canvas);

  if(await blob.slice(24, 28).text() == "ALFA") {
    const length = (new DataView(await blob.slice(28, 32).arrayBuffer())).getUint32(0, false);

    const [alphaImage, alphaCtx] = await blobToCanvas(blob.slice(32, 32 + length));
    if(alphaImage.width !== colorImage.width || alphaImage.height !== colorImage.height) {
      throw "mismatched size!"
    }

    const colorData = colorCtx.getImageData(0, 0, colorImage.width, colorImage.height);
    const alphaData = alphaCtx.getImageData(0, 0, alphaImage.width, alphaImage.height);

    for (let i = 0; i < colorData.data.length; i += 4) {
      colorData.data[i + 3] = alphaData.data[i];
    }
    colorCtx.putImageData(colorData, 0, 0);
  }
}


const url_prefix = "https://sims4cdn.ea.com/content.ts4/config/live/thumbs/";

;(async () => {

const mutex = new Mutex();
let loaderRunning = false;
const loadQueue = [];
const loading = [];

const loaded = async (canvas) => {
  const release = await mutex.lock();
  try {
    canvas.classList.add("loaded");
    const index = loading.indexOf(canvas);
    if (index > -1) {
      loading.splice(index, 1);
    }
  }
  catch(error) {
    release();
    throw error;
  }
  release();
};

const loader = async () => {
  const release = await mutex.lock();
  try {
    while(loading.length < 10) {
      if(loadQueue.length === 0) {
        loaderRunning = false;
        release();
        return;
      }

      const canvas = loadQueue.shift();
      loading.push(canvas);
      loadImage(canvas, loaded);
    }

    window.setTimeout(loader, 50);
  }
  catch(error) {
    release();
    throw error;
  }
  release();
};

const addToLoad = async (item) => {
  const release = await mutex.lock();
  try {
    for(const canvas of item.querySelectorAll("canvas:not(.loaded)")) {
      loadQueue.push(canvas);
      if(!loaderRunning) {
        loaderRunning = true;
        loader();
      }
    }
  }
  catch(error) {
    release();
    throw error;
  }
  release();
};

const _toggleItem = item => {
  item.classList.toggle("collapsed");
  addToLoad(item);
};

const toggleItem = e => {
  _toggleItem(e.currentTarget);
};

const toggleAll = e => {
  const container = e.currentTarget.nextElementSibling;
  const collapsed = container.querySelectorAll(".item.collapsed");
  const expanded = container.querySelectorAll(".item:not(.collapsed)");
  if(expanded.length > 0) {
    for(const item of expanded) {
      _toggleItem(item);
    }
  }
  else {
    for(const item of collapsed) {
      _toggleItem(item);
    }
  }
};

const result = await fetch(json_path)
const data = await result.json()

const name = document.createElement("h1")
name.innerHTML = data.name;
document.body.append(name);

for(const [items_name, items_code] of [["Create a Sim", "cas"], ["Build Mode", "bb"]]) {
  if(typeof data[items_code] === "undefined") {
    continue;
  }

  const header = document.createElement("h2");
  header.innerHTML = items_name + " items (click to hide/show all swatches)";
  document.body.append(header);

  const container = document.createElement("div");
  container.classList.add(items_code);
  document.body.append(container);

  for(const ids of data[items_code]) {
    const itemContainer = document.createElement("div");
    itemContainer.classList.add("item");
    itemContainer.classList.add("collapsed");

    if(document.location.hostname !== "localhost") {
      ids.unshift(ids.splice(getRandomInt(0, ids.length), 1)[0]);
    }
    for(const id of ids) {
      const canvas = document.createElement("canvas");
      canvas.url = url_prefix + id;
      canvas.setAttribute("data-id", id);
      canvas.width = 0;
      canvas.height = 0;
      itemContainer.append(canvas);
    }

    itemContainer.addEventListener("click", toggleItem);
    header.addEventListener("click", toggleAll);

    container.append(itemContainer);
  }
}


{
  const release = await mutex.lock();
  for(const canvas of document.querySelectorAll(".item > canvas:first-child")) {
    loadQueue.push(canvas);
  }
  loaderRunning = true;
  loader();
  release();
}

if(typeof data["original"] !== "undefined") {
  for(const id of data["original"]) {
    document.querySelector('[data-id="' + id + '"]').style.border = "3px red solid";
  }
}

})();
