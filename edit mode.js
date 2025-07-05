const s = document.createElement("script");
s.onload = () => {
  dragula({
    direction: "horizontal",
    isContainer: el => el.classList.contains("item")
  });
  dragula([...document.querySelectorAll("body > div[class]")]);
};
s.src = "//bevacqua.github.io/dragula/dist/dragula.js";
document.body.append(s);

const cancelClick = e => {
  e.preventDefault();
  e.stopPropagation();
  return false;
};

const rightClick = e => {
  e.preventDefault();
  const el = e.currentTarget;
  const parent = el.parentElement;

  if(el.nextElementSibling === null) {
    const newParent = parent.previousElementSibling;
    if(newParent === null) {
      alert("Can't merge with previous item because there's none!");
      return;
    }
    newParent.append(...parent.children);
    parent.remove();
  }
  else {
    const newParent = document.createElement("div");
    newParent.classList.add("item");
    const idx = Array.prototype.indexOf.call(parent.children, el);
    if(idx == -1) {
      alert("canvas not in item???");
      return;
    }
    newParent.append(...Array.prototype.slice.call(parent.children, 0, idx + 1));
    parent.before(newParent);
  }
};

for(const el of document.querySelectorAll(".item")) {
  el.addEventListener("click", cancelClick, true);
}

for(const el of document.querySelectorAll("canvas")) {
  el.addEventListener("contextmenu", rightClick);
}

const info = document.createElement("div");
info.innerHTML = "<div>Entering edit mode. Work on expanded view. Right click on image to move it together with previous images to a new item. Right click on the last image to merge all images with the previous item. Drag images to change order. Drag items to change order. Moving image from one item to another works like ass, it swaps items if you move your mouse too far. After you're done click on the Export button.</div>";
const button = document.createElement("button");
button.innerHTML = "Export";
button.addEventListener("click", e => {
  e.preventDefault();
  let textarea = document.querySelector("#export");
  if(textarea === null) {
    textarea = document.createElement("textarea");
    textarea.id = "export";
    info.prepend(textarea);
  }
  result = {}
  for(const groupEl of document.querySelectorAll("body > div[class]")) {
    const type = groupEl.getAttribute("class");
    const group = [];
    for(const itemEl of groupEl.children) {
      const item = [];
      for(const image of itemEl.children) {
        item.push(image.getAttribute("data-id"));
      }
      group.push(item);
    }
    result[type] = group;
  }
  result["name"] = document.querySelector("h1").innerText;
  textarea.value = JSON.stringify(result, null, "  ").replace("™", "\\u2122");
});
info.append(button)
document.body.prepend(info);
