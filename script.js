const API_URL = `https://pokeapi.co/api/v2/pokemon?limit=100&offset=0`;

const container = document.getElementById("container");

const fetchingData = (url) => {
  return fetch(url)
    .then((res) => res.json())
    .catch((err) => console.log(`Error while fetching url: ${url}`, err));
};

const renderPokemons = async () => {
  const data = await fetchingData(API_URL);

  data.results.forEach(async (x) => {
    const pokemon = await fetchingData(x.url);

    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.name = x.name;

    card.innerHTML = `
      <img src=${pokemon.sprites.front_default} alt=${x.name}>
      <div class="info-cont">
        <h3>${x.name}</h3>
        <div>
          ${pokemon.types
            .map((y) => {
              return `
                <p class=${y.type.name}>${y.type.name}</p>
              `;
            })
            .join("")}
        </div>
      </div>
      `;

    container.appendChild(card);
  });
};

renderPokemons();

const renderPokemon = async (name) => {
  const pokemon = await fetchingData(
    `https://pokeapi.co/api/v2/pokemon/${name}`,
  );

  // pokemon.abilities
  // pokemon.sprites

  container.innerHTML = `
    <div class="pokemon">
      <div class="short">
        <img src=${pokemon.sprites.front_default}>
        <h3>${pokemon.name}</h3>
        <div class="types">
        ${pokemon.types
          .map((y) => {
            return `
              <p class=${y.type.name}>${y.type.name}</p>
            `;
          })
          .join("")}
        </div>
      </div>
      <div class="stats">
      ${pokemon.stats
        .map((y) => {
          return `
            <p>${y.stat.name}: ${y.base_stat}</p>
          `;
        })
        .join("")}
      </div>
      <div class="moves">
        ${(await Promise.all(
          pokemon.moves.map(async (y) => {
            const text = await fetchingData(y.move.url);
            let desc = "";

            text.effect_entries.forEach((x) => {
              if (x.language.name === "en") {
                desc = x.effect;
              }
            });

            return `
              <p>${y.move.name}: ${desc}</p>
            `;
          })
        )).join("")}
      </div>
    </div>
  `;
};

container.addEventListener("click", (event) => {
  const card = event.target.closest(".card");

  if (!card) return;

  document.querySelectorAll(".card").forEach((card) => {
    card.classList.add("hidden");
  });

  // console.log("Card clicked", card.dataset.name)

  renderPokemon(card.dataset.name);
});
