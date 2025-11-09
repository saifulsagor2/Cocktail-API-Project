

const API_SEARCH = "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=";
const API_LOOKUP = "https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=";

const drinkContainer = document.getElementById("drink-container");
const groupContainer = document.getElementById("group-container");
const drinkCountEl = document.getElementById("drink-count");
const notFoundEl = document.getElementById("not-found");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");

const modalEl = document.getElementById("drinkModal");
const modal = new bootstrap.Modal(modalEl);
const modalTitle = document.getElementById("modalTitle");
const modalImage = document.getElementById("modalImage");
const modalCategory = document.getElementById("modalCategory");
const modalInstructions = document.getElementById("modalInstructions");
const modalInfo = document.getElementById("modalInfo");
const modalIngredients = document.getElementById("modalIngredients");
const modalAddBtn = document.getElementById("modalAddBtn");

let groupList = [];
let lastShownDrink = null;


function sanitize(text) {
  return text ? String(text) : "";
}

function setNotFound(show) {
  notFoundEl.classList.toggle("d-none", !show);
}

function extractIngredients(drink) {
  const arr = [];
  for (let i = 1; i <= 15; i++) {
    const ingr = drink[`strIngredient${i}`];
    const measure = drink[`strMeasure${i}`];
    if (ingr && ingr.trim()) {
      const part = (measure && measure.trim()) ? `${measure.trim()} ${ingr.trim()}` : ingr.trim();
      arr.push(part);
    }
  }
  return arr;
}

function loadDefaultDrinks() {
  fetch(API_SEARCH + "a")
    .then(r => r.json())
    .then(data => {
      const drinks = data.drinks || [];
      displayDrinks(drinks.slice(0, 8));
    })
    .catch(err => {
      console.error("Failed to load default drinks:", err);
      alert("Could not load drinks. Check your network.");
    });
}

searchBtn.addEventListener("click", () => {
  const q = searchInput.value.trim();
  if (!q) {
    alert("Please type a drink name to search.");
    return;
  }
  searchDrinks(q);
});

resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  setNotFound(false);
  loadDefaultDrinks();
});

function searchDrinks(query) {
  fetch(API_SEARCH + encodeURIComponent(query))
    .then(r => r.json())
    .then(data => {
      const drinks = data.drinks;
      if (!drinks) {
        drinkContainer.innerHTML = "";
        setNotFound(true);
      } else {
        setNotFound(false);
        displayDrinks(drinks.slice(0, 8));
      }
    })
    .catch(err => {
      console.error("Search error:", err);
      alert("Search failed. Try again.");
    });
}

function displayDrinks(drinks) {
  drinkContainer.innerHTML = "";
  drinks.forEach(drink => {
    const card = document.createElement("div");
    card.className = "drink-card";

    const shortInstr = sanitize(drink.strInstructions).slice(0, 15);

    card.innerHTML = `
      <img src="${sanitize(drink.strDrinkThumb)}" alt="${sanitize(drink.strDrink)}" loading="lazy">
      <div>
        <h6 class="mb-1">${sanitize(drink.strDrink)}</h6>
        <div class="drink-meta"><small><b>Category:</b> ${sanitize(drink.strCategory)}</small></div>
        <div class="drink-meta"><small>${shortInstr}${shortInstr.length >= 15 ? "..." : ""}</small></div>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn-success btn-sm btn-add" data-id="${sanitize(drink.idDrink)}" data-name="${sanitize(drink.strDrink)}" data-img="${sanitize(drink.strDrinkThumb)}">Add to Group</button>
        <button type="button" class="btn btn-outline-primary btn-sm btn-details" data-id="${sanitize(drink.idDrink)}">Details</button>
      </div>
    `;
    drinkContainer.appendChild(card);
  });

  drinkContainer.querySelectorAll(".btn-add").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const img = btn.dataset.img;
      addToGroup({ id, name, img });
    });
  });

  drinkContainer.querySelectorAll(".btn-details").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      openDetailsModal(id);
    });
  });
}

function addToGroup(item) {
  if (groupList.length >= 7) {
    alert("❌ You can’t add more than 7 drinks!");
    return;
  }
  if (groupList.some(g => g.id === item.id)) {
    alert("This drink is already in your group.");
    return;
  }
  groupList.push(item);
  updateGroupUI();
}

function updateGroupUI() {
  groupContainer.innerHTML = "";
  groupList.forEach((g, idx) => {
    const div = document.createElement("div");
    div.className = "group-item";
    div.setAttribute("data-index", idx);
    div.innerHTML = `
      <img src="${sanitize(g.img)}" alt="${sanitize(g.name)}">
      <div class="flex-fill text-truncate">${sanitize(g.name)}</div>
      <small class="text-muted ms-2">#${idx + 1}</small>
    `;

    div.addEventListener("click", () => {
      removeFromGroup(idx);
    });
    groupContainer.appendChild(div);
  });
  drinkCountEl.innerText = groupList.length;
}

function removeFromGroup(index) {
  groupList.splice(index, 1);
  updateGroupUI();
}

function openDetailsModal(id) {
  fetch(API_LOOKUP + encodeURIComponent(id))
    .then(r => r.json())
    .then(data => {
      const drink = (data.drinks && data.drinks[0]) ? data.drinks[0] : null;
      if (!drink) {
        alert("Details not found.");
        return;
      }

      lastShownDrink = {
        id: drink.idDrink,
        name: drink.strDrink,
        img: drink.strDrinkThumb
      };

      modalTitle.textContent = sanitize(drink.strDrink);
      modalImage.src = sanitize(drink.strDrinkThumb);
      modalCategory.textContent = `Category: ${sanitize(drink.strCategory)} • ${sanitize(drink.strAlcoholic || "")}`;
      modalInstructions.textContent = sanitize(drink.strInstructions || "No instructions available.");

      modalInfo.innerHTML = "";
      const infoRows = [
        ["Alcoholic", drink.strAlcoholic],
        ["Glass", drink.strGlass],
        ["IBA", drink.strIBA || "N/A"],
        ["Tags", drink.strTags || "N/A"],
        ["Modified", drink.dateModified || "Unknown"]
      ];
      infoRows.forEach(([k, v]) => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.innerHTML = `<strong>${k}:</strong> ${sanitize(v)}`;
        modalInfo.appendChild(li);
      });

      modalIngredients.innerHTML = "";
      const ingr = extractIngredients(drink);
      if (ingr.length === 0) {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = "No ingredients available.";
        modalIngredients.appendChild(li);
      } else {
        ingr.forEach(x => {
          const li = document.createElement("li");
          li.className = "list-group-item";
          li.textContent = x;
          modalIngredients.appendChild(li);
        });
      }

      modalAddBtn.dataset.id = sanitize(drink.idDrink);
      modalAddBtn.dataset.name = sanitize(drink.strDrink);
      modalAddBtn.dataset.img = sanitize(drink.strDrinkThumb);

      modal.show();
    })
    .catch(err => {
      console.error("Error loading details:", err);
      alert("Could not load drink details.");
    });
}

modalAddBtn.addEventListener("click", () => {
  const id = modalAddBtn.dataset.id;
  const name = modalAddBtn.dataset.name;
  const img = modalAddBtn.dataset.img;
  if (!id) return;
  addToGroup({ id, name, img });
  modal.hide();
});

loadDefaultDrinks();
updateGroupUI();
