const evenements = {
  hiver: [
    {
      nom: "Tempête de neige",
      conditions: (monde) =>
        monde.saison === "hiver" && monde.stats.ecologie > 50,
      message: "🌨️ Une tempête de neige paralyse les transports en ville.",
      effets: {
        santePublique: -4,
        economie: -5,
      },
    },
  ],
  été: [
    {
      nom: "Canicule",
      conditions: (monde) =>
        monde.saison === "été" && monde.stats.santePublique < 45,
      message:
        "🔥 Une vague de chaleur frappe la ville,c'est la canicule! Les plus fragiles sont en danger.",
      effets: {
        santePublique: -5,
        economie: -2,
      },
    },
  ],
  global: [
    {
      nom: "Gréve générale",
      conditions: (monde) =>
        monde.stats.tensionSociale > 75 && monde.stats.chômage > 65,
      message: "📢 Une grève générale paralyse de nombreux services publics.",
      effets: {
        tensionSociale: +4,
        economie: -3,
      },
    },
  ],
};

module.exports = { evenements };
