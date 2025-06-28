const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { Client } = require("pg");

const caleJson = path.join(__dirname, "resurse", "json", "oferte.json");

const valoriReducere = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const durataMinute = 2;

(async () => {
  client=new Client({
    database:"proiect_bd",
    user:"alexandra",
    password:"Alexandra8",
    host:"localhost",
    port:5432
})

  await client.connect();

  const rezultat = await client.query(`SELECT DISTINCT categorie FROM vacante`);
  const categorii = rezultat.rows.map(r => r.categorie);
  await client.end();

  let continutJson = { oferte: [] };
  try {
    const continutFisier = await fsp.readFile(caleJson, "utf8");
    continutJson = JSON.parse(continutFisier);
  } catch (err) {
    console.log("Fișierul nu există sau nu e valid, se va crea unul nou.");
  }

  const ultimaOferta = continutJson.oferte[0];
  let categoriiValide = categorii;
  if (ultimaOferta) {
    categoriiValide = categorii.filter(cat => cat !== ultimaOferta.categorie);
  }

  const categorieAleasa = categoriiValide[Math.floor(Math.random() * categoriiValide.length)];
  const reducere = valoriReducere[Math.floor(Math.random() * valoriReducere.length)];

  const dataIncepere = new Date();
  const dataFinalizare = new Date(dataIncepere.getTime() + durataMinute * 60000);

  const formatOra = data => {
    const h = String(data.getHours()).padStart(2, "0");
    const m = String(data.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const nouaOferta = {
    categorie: categorieAleasa,
    reducere,
    "ora-incepere": formatOra(dataIncepere),
    "ora-finalizare": formatOra(dataFinalizare)
  };

  continutJson.oferte.unshift(nouaOferta);
  await fsp.writeFile(caleJson, JSON.stringify(continutJson, null, 2));

  console.log("Ofertă generată cu succes:", nouaOferta);
})();
