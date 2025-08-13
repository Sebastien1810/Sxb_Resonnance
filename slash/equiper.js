const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");

const marcheNoirData = require("../data/marche_noir.json");
const CATALOGUE = new Map((marcheNoirData.objets || []).map((o) => [o.nom, o]));

const clamp = (n, min = 0, max = 999) => Math.max(min, Math.min(max, n));

function getEffets(item) {
  if (!item) return {};
  if (item.effets && typeof item.effets === "object") return item.effets;
  const canon = CATALOGUE.get(item.nom);
  return canon?.effets || {};
}

function computeEquipBonus(equipe = {}) {
  const bonus = { attaque: 0, defense: 0 };
  for (const slot of ["arme", "armure"]) {
    const effets = getEffets(equipe?.[slot]);
    if (typeof effets.attaque === "number") bonus.attaque += effets.attaque;
    if (typeof effets.defense === "number") bonus.defense += effets.defense;
  }
  return bonus;
}

function ensureBaseFloor(joueur) {
  const N = joueur.niveau || 1;
  joueur.statsCombatBase ||= { attaque: 0, defense: 0 };
  const atkMin = 3 + N;
  const defMin = 2 + Math.floor(N / 2);

  if (joueur.statsCombatBase.attaque < atkMin) {
    joueur.statsCombatBase.attaque = atkMin;
  }
  if (joueur.statsCombatBase.defense < defMin) {
    joueur.statsCombatBase.defense = defMin;
  }
}

function recalcTotalStats(joueur) {
  ensureBaseFloor(joueur);
  const base = joueur.statsCombatBase;
  const bonus = computeEquipBonus(joueur.inventaire.équipé);
  joueur.statsCombat ||= { attaque: 0, defense: 0 };
  joueur.statsCombat.attaque = clamp(
    (base.attaque || 0) + (bonus.attaque || 0)
  );
  joueur.statsCombat.defense = clamp(
    (base.defense || 0) + (bonus.defense || 0)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("equiper")
    .setDescription("Équipe un objet de ton inventaire via un menu déroulant."),

  async execute(interaction, playersDB) {
    const userId = interaction.user.id;

    await playersDB.read();
    const joueur = playersDB.data[userId];
    if (!joueur) {
      return interaction.reply({
        content: "❌ Joueur introuvable.",
        ephemeral: true,
      });
    }

    // Initialisation / normalisation
    joueur.statsCombatBase ||= {
      attaque: 3 + (joueur.niveau || 1),
      defense: 2 + Math.floor((joueur.niveau || 1) / 2),
    };
    joueur.statsCombat ||= { attaque: 0, defense: 0 };
    joueur.inventaire ||= { objets: [], équipé: { arme: null, armure: null } };
    joueur.inventaire.équipé ||= { arme: null, armure: null };

    // normalise d’anciens objets string
    joueur.inventaire.objets = (joueur.inventaire.objets || [])
      .map((o) => (typeof o === "string" ? CATALOGUE.get(o) || null : o))
      .filter(Boolean);

    const objetsEquipables = joueur.inventaire.objets.filter(
      (obj) =>
        obj &&
        obj.type === "équipement" &&
        ["arme", "armure"].includes(obj.categorie)
    );

    if (!objetsEquipables.length) {
      return interaction.reply({
        content: "❌ Tu n'as aucun équipement à équiper.",
        ephemeral: true,
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("selection_equipement")
      .setPlaceholder("Choisis un objet à équiper")
      .addOptions(
        objetsEquipables.map((objet) => ({
          label: objet.nom,
          description: (objet.description || "").slice(0, 50),
          value: objet.nom,
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const reply = await interaction.reply({
      content: "🛠️ Sélectionne un équipement à équiper :",
      components: [row],
      ephemeral: true,
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 30_000,
    });

    collector.on("collect", async (selectInteraction) => {
      const selectedNom = selectInteraction.values[0];
      const objet =
        CATALOGUE.get(selectedNom) ||
        objetsEquipables.find((o) => o.nom === selectedNom);
      if (!objet) {
        return selectInteraction.reply({
          content: "❌ Objet introuvable.",
          ephemeral: true,
        });
      }

      const slot = objet.categorie;
      const ancien = joueur.inventaire.équipé[slot];
      if (ancien) joueur.inventaire.objets.push(ancien);

      const idx = joueur.inventaire.objets.findIndex(
        (o) => o && o.nom === objet.nom
      );
      if (idx !== -1) joueur.inventaire.objets.splice(idx, 1);

      joueur.inventaire.équipé[slot] = objet;

      // Debug + recalcul
      const before = { ...joueur.statsCombat };
      recalcTotalStats(joueur);
      const after = { ...joueur.statsCombat };

      console.log("[/equiper]", {
        base: joueur.statsCombatBase,
        equipe: {
          arme: joueur.inventaire.équipé.arme?.nom,
          armure: joueur.inventaire.équipé.armure?.nom,
        },
        effetsArme: getEffets(joueur.inventaire.équipé.arme),
        effetsArmure: getEffets(joueur.inventaire.équipé.armure),
        before,
        after,
      });

      await playersDB.write();

      await selectInteraction.update({
        content: `✅ Tu as équipé **${objet.nom}** comme ${slot}. (ATK ${joueur.statsCombat.attaque} / DEF ${joueur.statsCombat.defense})`,
        components: [],
      });
    });

    collector.on("end", async () => {
      try {
        await reply.edit({ components: [] });
      } catch {}
    });
  },
};
