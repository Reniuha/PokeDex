let offset = 0;
let limit = 100;

const MAX_NORMAL_ID = 1025;

const container = document.getElementById("container");
const searchBar = document.getElementById("search-bar");
const changePage = document.getElementById("change-page");
const filterSelect = document.getElementById("filter");

let allPokemonList = [];
let pokemonCache = new Map();
let typeCache = new Map();

let currentRenderId = 0;

const fetchingData = async (url) => {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.log(`Error while fetching url: ${url}`, err);
    return null;
  }
};

function getPokemonIdFromUrl(url) {
  const parts = url.split("/").filter(Boolean);
  return Number(parts[parts.length - 1]);
}

async function getAllPokemonList() {
  if (allPokemonList.length > 0) return allPokemonList;

  const data = await fetchingData(
    "https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0"
  );

  if (!data || !data.results) return [];

  allPokemonList = data.results.map((pokemon) => {
    return {
      name: pokemon.name,
      url: pokemon.url,
      id: getPokemonIdFromUrl(pokemon.url),
    };
  });

  return allPokemonList;
}

function getNormalPokemonList() {
  return allPokemonList.filter((pokemon) => pokemon.id <= MAX_NORMAL_ID);
}

function sortPokemonList(list) {
  const sortType = filterSelect.value;

  return [...list].sort((a, b) => {
    if (sortType === "Lowest") {
      return a.id - b.id;
    }

    if (sortType === "Highest") {
      return b.id - a.id;
    }

    if (sortType === "A-Z") {
      return a.name.localeCompare(b.name);
    }

    if (sortType === "Z-A") {
      return b.name.localeCompare(a.name);
    }

    return a.id - b.id;
  });
}

function getCurrentPagePokemonList() {
  const normalPokemon = getNormalPokemonList();
  const sortedPokemon = sortPokemonList(normalPokemon);

  return sortedPokemon.slice(offset, offset + limit);
}

async function getPokemon(identifier) {
  const key = String(identifier).toLowerCase();

  if (pokemonCache.has(key)) {
    return pokemonCache.get(key);
  }

  const pokemon = await fetchingData(`https://pokeapi.co/api/v2/pokemon/${key}`);

  if (!pokemon) return null;

  pokemonCache.set(String(pokemon.id), pokemon);
  pokemonCache.set(pokemon.name.toLowerCase(), pokemon);

  return pokemon;
}

async function getType(typeName) {
  if (typeCache.has(typeName)) {
    return typeCache.get(typeName);
  }

  const type = await fetchingData(`https://pokeapi.co/api/v2/type/${typeName}`);

  if (!type) return null;

  typeCache.set(typeName, type);
  return type;
}

function createDetailsTab() {
  let detailsTab = document.getElementById("pokemon-details");

  if (!detailsTab) {
    detailsTab = document.createElement("div");
    detailsTab.id = "pokemon-details";
    detailsTab.classList.add("hidden");
    document.body.appendChild(detailsTab);
  }

  return detailsTab;
}

function formatName(name) {
  return name.replaceAll("-", " ");
}

function createPokemonCard(pokemon) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.name = pokemon.name;
  card.dataset.id = pokemon.id;

  const id = String(pokemon.id);

  card.innerHTML = `
    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
    <div class="info-cont">
      <p class="pokemon-id">#${id.padStart(4, "0")}</p>
      <h3 class="pokemon-name">${formatName(pokemon.name)}</h3>
      <div>
        ${pokemon.types
          .map((typeSlot) => {
            return `
              <p class="${typeSlot.type.name}">${typeSlot.type.name}</p>
            `;
          })
          .join("")}
      </div>
    </div>
  `;

  card.addEventListener("click", () => {
    openPokemonDetails(pokemon.name);
  });

  return card;
}

function createLoadingCard() {
  const card = document.createElement("div");
  card.classList.add("card", "loading-card");

  card.innerHTML = `
    <div class="loading-img"></div>
    <div class="info-cont">
      <p>Loading...</p>
    </div>
  `;

  return card;
}

async function renderPokemons() {
  currentRenderId++;

  const renderId = currentRenderId;

  const detailsTab = createDetailsTab();

  container.classList.remove("hidden");
  changePage.classList.remove("hidden");
  detailsTab.classList.add("hidden");
  detailsTab.innerHTML = "";

  container.innerHTML = "";

  await getAllPokemonList();

  if (renderId !== currentRenderId) return;

  const pagePokemon = getCurrentPagePokemonList();

  if (pagePokemon.length === 0) {
    container.innerHTML = "<p>No Pokémon found.</p>";
    return;
  }

  pagePokemon.forEach((pokemonBasic) => {
    const loadingCard = createLoadingCard();
    container.appendChild(loadingCard);

    getPokemon(pokemonBasic.name).then((pokemon) => {
      if (renderId !== currentRenderId) return;
      if (!pokemon) return;

      const card = createPokemonCard(pokemon);
      loadingCard.replaceWith(card);
    });
  });
}

async function searchPokemons(value) {
  currentRenderId++;

  const renderId = currentRenderId;
  const searchValue = value.trim().toLowerCase();

  const detailsTab = createDetailsTab();

  detailsTab.classList.add("hidden");
  detailsTab.innerHTML = "";

  if (searchValue === "") {
    renderPokemons();
    return;
  }

  container.classList.remove("hidden");
  changePage.classList.add("hidden");

  container.innerHTML = "";

  if (!isNaN(searchValue)) {
    const pokemon = await getPokemon(searchValue);

    if (renderId !== currentRenderId) return;

    if (pokemon) {
      const card = createPokemonCard(pokemon);
      container.appendChild(card);
    } else {
      container.innerHTML = "<p>No Pokémon found.</p>";
    }

    return;
  }

  await getAllPokemonList();

  if (renderId !== currentRenderId) return;

  const matches = allPokemonList
    .filter((pokemon) => pokemon.name.includes(searchValue))
    .slice(0, 50);

  const sortedMatches = sortPokemonList(matches);

  if (sortedMatches.length === 0) {
    container.innerHTML = "<p>No Pokémon found.</p>";
    return;
  }

  sortedMatches.forEach((pokemonBasic) => {
    const loadingCard = createLoadingCard();
    container.appendChild(loadingCard);

    getPokemon(pokemonBasic.name).then((pokemon) => {
      if (renderId !== currentRenderId) return;
      if (!pokemon) return;

      const card = createPokemonCard(pokemon);
      loadingCard.replaceWith(card);
    });
  });
}

async function getPokemonDescription(pokemonId) {
  const species = await fetchingData(
    `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`
  );

  if (!species || !species.flavor_text_entries) {
    return "No description found.";
  }

  const englishEntry = species.flavor_text_entries.find((entry) => {
    return entry.language.name === "en";
  });

  if (!englishEntry) {
    return "No English description found.";
  }

  return englishEntry.flavor_text.replace(/\f/g, " ").replace(/\n/g, " ");
}

async function getTypeMatchups(types) {
  const allTypes = [
    "normal",
    "fire",
    "water",
    "electric",
    "grass",
    "ice",
    "fighting",
    "poison",
    "ground",
    "flying",
    "psychic",
    "bug",
    "rock",
    "ghost",
    "dragon",
    "dark",
    "steel",
    "fairy",
  ];

  const multipliers = {};

  allTypes.forEach((type) => {
    multipliers[type] = 1;
  });

  for (const pokemonType of types) {
    const typeData = await getType(pokemonType.type.name);

    if (!typeData || !typeData.damage_relations) continue;

    typeData.damage_relations.double_damage_from.forEach((relation) => {
      multipliers[relation.name] *= 2;
    });

    typeData.damage_relations.half_damage_from.forEach((relation) => {
      multipliers[relation.name] *= 0.5;
    });

    typeData.damage_relations.no_damage_from.forEach((relation) => {
      multipliers[relation.name] = 0;
    });
  }

  const weaknesses = [];
  const resistances = [];
  const immunities = [];

  Object.entries(multipliers).forEach(([type, multiplier]) => {
    if (multiplier > 1) {
      weaknesses.push(`${type} x${multiplier}`);
    } else if (multiplier > 0 && multiplier < 1) {
      resistances.push(`${type} x${multiplier}`);
    } else if (multiplier === 0) {
      immunities.push(type);
    }
  });

  return {
    weaknesses,
    resistances,
    immunities,
  };
}

async function openPokemonDetails(identifier) {
  currentRenderId++;

  const detailsTab = createDetailsTab();

  container.classList.add("hidden");
  changePage.classList.add("hidden");

  detailsTab.classList.remove("hidden");
  detailsTab.innerHTML = "<p>Loading details...</p>";

  const pokemon = await getPokemon(identifier);

  if (!pokemon) {
    detailsTab.innerHTML = `
      <button id="back-to-cards" class="back-btn">Back</button>
      <p>Could not load Pokémon details.</p>
    `;

    document
      .getElementById("back-to-cards")
      .addEventListener("click", closePokemonDetails);

    return;
  }

  const description = await getPokemonDescription(pokemon.id);
  const matchups = await getTypeMatchups(pokemon.types);

  const id = String(pokemon.id);

  detailsTab.innerHTML = `
    <button id="back-to-cards" class="back-btn">Back</button>

    <div class="pokemon">
      <div class="short">
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">

        <p class="pokemon-id">#${id.padStart(4, "0")}</p>
        <h2 class="pokemon-name">${formatName(pokemon.name)}</h2>

        <div class="types">
          ${pokemon.types
            .map((typeSlot) => {
              return `<p class="${typeSlot.type.name}">${typeSlot.type.name}</p>`;
            })
            .join("")}
        </div>
      </div>

      <div class="long">
        <div class="detail-card">
          <h3>Description</h3>
          <p>${description}</p>
        </div>

        <div class="detail-card">
          <h3>Basic Info</h3>
          <p>Height: ${pokemon.height / 10} m</p>
          <p>Weight: ${pokemon.weight / 10} kg</p>
          <p>Base Experience: ${pokemon.base_experience}</p>
        </div>

        <div class="detail-card">
          <h3>Stats</h3>
          ${pokemon.stats
            .map((stat) => {
              return `<p>${formatName(stat.stat.name)}: ${stat.base_stat}</p>`;
            })
            .join("")}
        </div>

        <div class="detail-card">
          <h3>Weaknesses</h3>
          ${
            matchups.weaknesses.length > 0
              ? matchups.weaknesses.map((type) => `<p>${type}</p>`).join("")
              : "<p>None</p>"
          }
        </div>

        <div class="detail-card">
          <h3>Resistances</h3>
          ${
            matchups.resistances.length > 0
              ? matchups.resistances.map((type) => `<p>${type}</p>`).join("")
              : "<p>None</p>"
          }
        </div>

        <div class="detail-card">
          <h3>Immunities</h3>
          ${
            matchups.immunities.length > 0
              ? matchups.immunities.map((type) => `<p>${type}</p>`).join("")
              : "<p>None</p>"
          }
        </div>

        <div class="detail-card">
          <h3>Abilities</h3>
          ${pokemon.abilities
            .map((abilitySlot) => {
              return `<p>${formatName(abilitySlot.ability.name)}</p>`;
            })
            .join("")}
        </div>
      </div>
    </div>
  `;

  document
    .getElementById("back-to-cards")
    .addEventListener("click", closePokemonDetails);
}

function closePokemonDetails() {
  const detailsTab = createDetailsTab();

  detailsTab.classList.add("hidden");
  detailsTab.innerHTML = "";

  container.classList.remove("hidden");

  if (searchBar.value.trim() === "") {
    changePage.classList.remove("hidden");
    renderPokemons();
  } else {
    changePage.classList.add("hidden");
    searchPokemons(searchBar.value);
  }
}

function pages() {
  const totalPages = Math.ceil(MAX_NORMAL_ID / limit);

  changePage.innerHTML = "";

  for (let i = 0; i < totalPages; i++) {
    changePage.innerHTML += `
      <button class="page-num" data-page="${i}">${i + 1}</button>
    `;
  }

  document.querySelectorAll(".page-num").forEach((num) => {
    num.addEventListener("click", (event) => {
      const page = Number(event.target.dataset.page);

      offset = page * limit;
      searchBar.value = "";

      renderPokemons();
    });
  });
}

let searchTimeout;

searchBar.addEventListener("input", (event) => {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    searchPokemons(event.target.value);
  }, 250);
});

filterSelect.addEventListener("change", () => {
  offset = 0;

  if (searchBar.value.trim() === "") {
    renderPokemons();
  } else {
    searchPokemons(searchBar.value);
  }
});

pages();
renderPokemons();