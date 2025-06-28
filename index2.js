const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const sass = require('sass');
const app = express();
const port = 8080;
const sharp = require('sharp');
const pg = require('pg');





const formidable=require("formidable");
const {Utilizator}=require("./module_proprii/utilizator.js")
const session=require('express-session');
const Drepturi = require("./module_proprii/drepturi.js");

const AccesBD=require("./module_proprii/accesbd.js")
AccesBD.getInstanta().select({tabel:"vacante", campuri:["*"]},function(err,rez){
    console.log("-----------------Acces BD ---------------- ")
    console.log(err)
    console.log(rez)
})




const Client=pg.Client;

client=new Client({
    database:"proiect_bd",
    user:"alexandra",
    password:"Alexandra8",
    host:"localhost",
    port:5432
})

client.connect()
client.query("select * from vacante", function(err, rezultat ){
    console.log(err)    
    console.log("Rezultat query: ",rezultat)
})
client.query("select * from unnest(enum_range(null::categorie_mare))", function(err, rezultat ){
    console.log(err)    
    console.log(rezultat)
})



// Global objects for storing application-wide data
global.obiectGlobal = {
  folderScss: path.join(__dirname, "resurse/scss"),
  folderCss: path.join(__dirname, "resurse/scss"),
  folderBackup: path.join(__dirname, "backup")
};

globalThis.obGlobal = {
  obErori: null,
  obImagini: null
};


app.get("/seturi", async (req, res) => {
  try {
    // Selectează toate seturile
    const { rows: seturi } = await client.query("SELECT * FROM seturi");

    // Pentru fiecare set, încarcă vacanțele și calculează prețul
    for (let set of seturi) {
      const { rows: vacante } = await client.query(`
        SELECT v.* FROM vacante v
        JOIN asociere_set a ON v.id = a.id_produs
        WHERE a.id_set = $1
      `, [set.id]);

      set.vacante = vacante;

      const suma = vacante.reduce((acc, v) => acc + Number(v.pret), 0);
      const reducere = Math.min(5, vacante.length) * 0.05;
      set.pret_final = (suma * (1 - reducere)).toFixed(2);
    }

    res.render("pagini/seturi", { seturi });

  } catch (err) {
    console.error("Eroare la afișarea seturilor:", err);
    res.status(500).render("pagini/eroare", { mesaj: "Eroare internă la afișarea seturilor." });
  }
});

app.get("/comparare", async (req, res) => {
    const id1 = req.query.id1;
    const id2 = req.query.id2;

    if (!id1 || !id2) {
        return res.status(400).send("Lipsesc ID-urile vacanțelor");
    }

    try {
        const result = await client.query(
            `SELECT * FROM vacante WHERE id IN ($1, $2) ORDER BY id`,
            [id1, id2]
        );

        if (result.rows.length !== 2) {
            return res.status(404).send("Una sau ambele vacanțe nu au fost găsite.");
        }

        const vacanta1 = result.rows[0];
        const vacanta2 = result.rows[1];

        // Transformare activități în listă
        if (typeof vacanta1.activitati === "string")
            vacanta1.activitati = vacanta1.activitati.split(",").map(s => s.trim());

        if (typeof vacanta2.activitati === "string")
            vacanta2.activitati = vacanta2.activitati.split(",").map(s => s.trim());

        res.render("pagini/comparare", {
            vacanta1,
            vacanta2
        });

    } catch (err) {
        console.error("Eroare la comparare:", err);
        res.status(500).send("Eroare internă");
    }
});



app.get("/vacante", async (req, res) => {
  try {
    const { rows: vacante } = await client.query("SELECT * FROM vacante ORDER BY data_disponibilitate DESC");
    const categorie_selectata = req.query.categorie || "toate";

    // === Prelucrări pentru cele 8 tipuri de input ===
    let pretulMinim = 300, pretulMaxim = 1200;
    let durataMin = null, durataMax = null;
    let dataMin = null;
    const dificultatiSet = new Set();
    const activitatiSet = new Set();
    const numeSet = new Set();
    const categoriiSet = new Set();

    for (let vac of vacante) {
      pret = parseInt(vac.pret);
      if (pretulMinim === null || pret < pretulMinim) pretulMinim = pret;
      if (pretulMaxim === null || pret > pretulMaxim) pretulMaxim = pret;

      if (durataMin === null || vac.durata_zile < durataMin) durataMin = vac.durata_zile;
      if (durataMax === null || vac.durata_zile > durataMax) durataMax = vac.durata_zile;

      const data = new Date(vac.data_disponibilitate);
      if (!isNaN(data) && (dataMin === null || data < dataMin)) dataMin = data;

      if (vac.dificultate) dificultatiSet.add(vac.dificultate.toLowerCase());
      if (vac.activitati) vac.activitati.split(",").forEach(a => activitatiSet.add(a.trim()));
      if (vac.nume) numeSet.add(vac.nume.trim());
      if (vac.categorie) categoriiSet.add(vac.categorie.trim());
    }

    res.render("pagini/vacante", {
      vacante,
      categorie_selectata,
      pretulMinim,
      pretulMaxim,
      durataMin,
      durataMax,
      dataMin: dataMin?.toISOString().split("T")[0],
      dificultati: Array.from(dificultatiSet),
      activitati: Array.from(activitatiSet),
      numeVacante: Array.from(numeSet),
      categoriiRadio: Array.from(categoriiSet)
    });
  } catch (err) {
    console.error("Eroare la extragerea vacanțelor:", err);
    res.status(500).render("pagini/eroare", { mesaj: "Nu s-au putut încărca vacanțele." });
  }
});


app.get("/vacanta/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const { rows } = await client.query("SELECT * FROM vacante WHERE id = $1", [id]);

    if (rows.length === 0) {
      return res.status(404).render("pagini/eroare", { mesaj: "Vacanța nu a fost găsită." });
    }

    const vac = rows[0];

    // Caută seturile în care apare această vacanță
    const { rows: seturi } = await client.query(`
      SELECT s.* FROM seturi s
      JOIN asociere_set a ON s.id = a.id_set
      WHERE a.id_produs = $1
    `, [id]);

    for (let set of seturi) {
      // Vacanțele din fiecare set
      const { rows: vacante } = await client.query(`
        SELECT v.* FROM vacante v
        JOIN asociere_set a ON v.id = a.id_produs
        WHERE a.id_set = $1
      `, [set.id]);

      set.vacante = vacante;

      const suma = vacante.reduce((acc, v) => acc + Number(v.pret), 0);
      const reducere = Math.min(5, vacante.length) * 0.05;
      set.pret_final = (suma * (1 - reducere)).toFixed(2);
    }

    res.render("pagini/vacanta", { vac, seturi });

  } catch (err) {
    console.error("Eroare la afișarea vacanței:", err);
    res.status(500).render("pagini/eroare", { mesaj: "Eroare internă la afișarea vacanței." });
  }
});


app.get("/fundal", function(req, res) {
  res.render("pagini/fundal");
});

app.get("/despre", function(req, res) {
  res.render("pagini/despre");
});
app.get("/pagina_galerie", function (req, res) {
  console.log("Rendering pagina_galerie using obGlobal.obImagini:", obGlobal.obImagini);
  res.render("pagini/galerie", {
    imagini: obGlobal.obImagini.imagini,
    cale_galerie: obGlobal.obImagini.cale_galerie
  });
});

// Initialize errors, folders, etc.
initErori();

// Create required folders (temp, backup, etc.)
["temp", "backup"].forEach(f => {
  const folder = path.join(__dirname, f);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`Creat folder: ${folder}`);
  } else {
    console.log(`Folderul ${folder} exista deja.`);
  }
});

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Output project information
console.log("Folderul proiectului: ", __dirname);
console.log("Calea fisierului index.js: ", __filename);
console.log("Folderul curent de lucru: ", process.cwd());

// Funcție asincronă pentru compilarea unui fișier SCSS într-un fișier CSS cu backup
async function compileazaScss(caleScss, caleCss) {
  // Verificăm dacă calea SCSS e absolută; dacă nu, o completăm cu folderul global pentru SCSS
  const scssAbs = path.isAbsolute(caleScss)
    ? caleScss
    : path.join(obiectGlobal.folderScss, caleScss);

  // Verificăm dacă ne-a fost oferită o cale CSS; dacă nu, generăm automat una în folderul CSS
  const cssAbs = caleCss
    ? (path.isAbsolute(caleCss) ? caleCss : path.join(obiectGlobal.folderCss, caleCss))
    : path.join(obiectGlobal.folderCss, path.basename(scssAbs, ".scss") + ".css");

  // Pregătim calea către folderul de backup unde vom salva versiunile vechi
  const backupPath = path.join(obiectGlobal.folderBackup, "resurse/scss");

  // Creăm folderul de backup dacă nu există (recursive = creează și directoare intermediare)
  await fsp.mkdir(backupPath, { recursive: true });

  try {
    // Dacă fișierul CSS există deja, îl copiem în backup înainte să-l rescriem
    if (fs.existsSync(cssAbs)) {
      // Generăm un timestamp pentru numele fișierului de backup (fără caractere ilegale)
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      // Obținem numele fișierului CSS fără extensie
      const numeFisier = path.basename(cssAbs, ".css");

      // Cream calea completă către fișierul de backup cu timestamp
      const caleBackup = path.join(backupPath, `${numeFisier}_${timestamp}.css`);

      // Copiem fișierul CSS actual în folderul de backup
      await fsp.copyFile(cssAbs, caleBackup);
    }

    // Compilăm fișierul SCSS în CSS folosind biblioteca `sass`
    const rezultat = sass.compile(scssAbs, { style: "expanded" });

    // Scriem CSS-ul generat în fișierul CSS de destinație
    await fsp.writeFile(cssAbs, rezultat.css);

    // Afișăm în consolă confirmarea compilării
    console.log(`[SCSS] Compilat: ${scssAbs} -> ${cssAbs}`);
  } catch (err) {
    // Dacă apare o eroare la compilare, o afișăm în consolă
    console.error(`[Eroare] La compilarea ${scssAbs}:`, err.message);
  }
}

// Funcție care compilează toate fișierele SCSS din folderul global definit
function compileazaToateScss() {
  // Citim toate fișierele din folderul SCSS și păstrăm doar cele care se termină în `.scss`
  const fisiere = fs.readdirSync(obiectGlobal.folderScss).filter(f => f.endsWith(".scss"));

  // Pentru fiecare fișier, apelăm funcția de compilare
  for (let f of fisiere) {
    compileazaScss(f);
  }
}

// La rularea serverului, compilăm toate fișierele SCSS existente
compileazaToateScss();

// Ascultăm modificările în folderul SCSS pentru a recompila automat fișierele afectate
fs.watch(obiectGlobal.folderScss, (event, filename) => {
  // Verificăm că fișierul modificat este un fișier SCSS valid
  if (filename && filename.endsWith(".scss")) {
    // Afișăm ce fișier a fost modificat și ce tip de eveniment s-a produs (ex: change)
    console.log(`[SCSS] Detectat eveniment: ${event} pe ${filename}`);

    // Recompilăm fișierul modificat
    compileazaScss(filename);
  }
});


// Function to initialize errors from JSON file
function initErori() {
  let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
  console.log(continut)
  obGlobal.obErori = JSON.parse(continut);
  console.log(obGlobal.obErori)

  obGlobal.obErori.eroare_default.imagine = obGlobal.obErori.cale_baza + "/" + obGlobal.obErori.eroare_default.imagine;
  for (let eroare of obGlobal.obErori.info_erori) {
    eroare.imagine = obGlobal.obErori.cale_baza + "/" + eroare.imagine;
  }
  console.log(obGlobal.obErori)

}

initErori();


function afisareEroare(res, identificator, titlu, text, imagine) {
  let eroare = obGlobal.obErori.info_erori.find(function (elem) {
    return elem.identificator == identificator;
  });

  let titluCustom, textCustom, imagineCustom;

  if (eroare) {
    if (eroare.status)
      res.status(identificator);
    titluCustom = titlu || eroare.titlu;
    textCustom = text || eroare.text;
    imagineCustom = imagine || eroare.imagine;
  }
  else {
    let err = obGlobal.obErori.eroare_default;
    titluCustom = titlu || err.titlu;
    textCustom = text || err.text;
    imagineCustom = imagine || err.imagine;
  }

  imagineCustom = imagineCustom.replace(/\\/g, '/');

  res.render("pagini/eroare", {
    titlu: titluCustom,
    text: textCustom,
    imagine: imagineCustom,
  });
}
app.use("/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));

// Middleware to add IP to locals
app.use(function (req, res, next) {
  res.locals.ip = req.ip;
  next();
});

// Serve static files from the 'resurse' directory with directory checks



// Route for home page (multiple path variants) with gallery data
app.get(['/', '/index', '/home'], function (req, res) {
  const ip = req.ip;

  res.render("pagini/index", {
    ip: ip,
    imagini: obGlobal.obImagini.imagini,
    cale_galerie: obGlobal.obImagini.cale_galerie // ✅ acum e inclusă
  });
});


app.get("/galerie_animata", (req, res) => {
  try {
    // Citește fișierul JSON la fiecare request
    const caleGalerieJson = path.join(__dirname, "resurse/json/galerie.json");
    const jsonImagini = JSON.parse(fs.readFileSync(caleGalerieJson, "utf8"));

    // Puteri ale lui 2 între 2 și 16
    const puteri = [2, 4, 8, 16];
    const imaginiPar = jsonImagini.imagini.filter((img, idx) => idx % 2 === 0);

    // Filtrează puterile posibile în funcție de câte imagini ai
    const puteriPosibile = puteri.filter(p => p <= imaginiPar.length);
    const nrImagini = puteriPosibile[Math.floor(Math.random() * puteriPosibile.length)];

    const imaginiSelectate = imaginiPar.slice(0, nrImagini);

    res.render("pagini/galerie_animata", {
      imaginiSelectate,
      cale_galerie: jsonImagini.cale_galerie
    });
  } catch (err) {
    console.error("Eroare la /galerie_animata:", err);
    res.status(500).send("Eroare la încărcarea galeriei animate.");
  }
});



// Funcție asincronă pentru inițializarea și procesarea imaginilor
async function initGallery() {
  // Creează calea absolută către fișierul galerie.json
  const galleryPath = path.join(__dirname, 'resurse/json/galerie.json');

  // Citește conținutul fișierului JSON și îl parsează într-un obiect JavaScript
  const galleryData = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));

  // Verifică dacă structura JSON este validă (conține câmpurile așteptate)
  if (!galleryData?.cale_galerie || !Array.isArray(galleryData?.imagini)) {
    throw new Error("Invalid gallery JSON structure"); // Aruncă eroare dacă structura e greșită
  }

  // Creează calea absolută către folderul principal al galeriei
  const galerieFolder = path.join(__dirname, galleryData.cale_galerie);

  // Creează calea absolută către subfolderul "mic" (unde se vor salva imaginile redimensionate)
  const smallFolder = path.join(galerieFolder, "mic");

  // Verifică dacă folderul "mic" există, dacă nu, îl creează recursiv
  if (!fs.existsSync(smallFolder)) {
    fs.mkdirSync(smallFolder, { recursive: true });
    console.log("Created small folder:", smallFolder);
  } else {
    console.log("Small folder already exists:", smallFolder);
  }

  // Simulează o dată și oră curentă pentru testare (12 mai 2025, ora 08:10)
  const currentDate = new Date("2025-05-12T08:10:00");
  console.log("Simulated current date:", currentDate);

  // Obține minutul din ora simulată
  const currentMinutes = currentDate.getMinutes();
  console.log("Current minutes:", currentMinutes);

  // Determină în care sfert de oră se află ora curentă
  let currentQuarter;
  if (currentMinutes < 15) {
    currentQuarter = "1"; // între minutul 0 și 14
  } else if (currentMinutes < 30) {
    currentQuarter = "2"; // între minutul 15 și 29
  } else if (currentMinutes < 45) {
    currentQuarter = "3"; // între minutul 30 și 44
  } else {
    currentQuarter = "4"; // între minutul 45 și 59
  }
  console.log("Determined current quarter:", currentQuarter);

  // Creează o listă pentru a stoca informațiile imaginilor procesate
  const processedImages = [];

  // Pentru fiecare imagine din JSON, se pornește o funcție asincronă de procesare
  const promises = galleryData.imagini.map(async image => {
    // Verifică dacă imaginea are o cale relativă validă
    if (!image?.cale_relativa) {
      console.warn("Skipping image - missing cale_relativa:", image);
      return; // Sare peste imagine dacă nu are cale validă
    }

    // Extrage numele fișierului și extensia prin separare la "."
    const [fileName, fileExt] = image.cale_relativa.split('.');

    // Creează calea completă către imaginea originală
    const sourcePath = path.join(galerieFolder, image.cale_relativa);

    // Creează calea completă unde se va salva imaginea procesată (.webp)
    const targetPath = path.join(smallFolder, `${fileName}.webp`);

    // Verifică dacă fișierul sursă există efectiv pe disc
    if (!fs.existsSync(sourcePath)) {
      console.warn("Source image not found:", sourcePath);
      return; // Dacă nu există, nu o procesează
    }

    // Încearcă procesarea imaginii (cu try/catch pentru protecție)
    try {
      // Folosește biblioteca `sharp` pentru a redimensiona și converti imaginea
      await sharp(sourcePath)               // Deschide imaginea sursă
        .resize({ width: 300 })             // Redimensionează la lățime 300px
        .webp()                             // Convertește în format .webp
        .toFile(targetPath);                // Salvează imaginea procesată la calea target

      console.log("Processed image:", image.cale_relativa);

      // Adaugă imaginea procesată în lista de rezultate
      processedImages.push({
        ...image,  // Copiază toate proprietățile originale
        fisier_mic: `/${galleryData.cale_galerie}/mic/${fileName}.webp` // Adaugă calea către fișierul mic
      });

    } catch (err) {
      // Afișează eroarea dacă procesarea imaginii eșuează
      console.error(`Error processing image ${image.cale_relativa}:`, err);
    }
  });

  // Așteaptă ca toate promisiunile (imagini procesate) să fie finalizate
  await Promise.all(promises);

  // Afișează în consolă câte imagini au fost procesate cu succes
  console.log("Successfully processed", processedImages.length, "images");


  // Update the global object with processed images
  obGlobal.obImagini = {
    cale_galerie: galleryData.cale_galerie,
    imagini: processedImages.filter(img => img.sfert_ora === currentQuarter),
    currentQuarter: currentQuarter
  };

  return processedImages;
}

app.post("/inregistrare",function(req, res){
    var username;
    var poza;
    var formular= new formidable.IncomingForm()
    formular.parse(req, function(err, campuriText, campuriFisier ){//4
        console.log("Inregistrare:",campuriText);


        console.log(campuriFisier);
        console.log(poza, username);
        var eroare="";


        // TO DO var utilizNou = creare utilizator
        var utilizNou =new Utilizator();
        try{
            utilizNou.setareNume=campuriText.nume[0];
            utilizNou.setareUsername=campuriText.username[0];
            utilizNou.email=campuriText.email[0]
            utilizNou.prenume=campuriText.prenume[0]
           
            utilizNou.parola=campuriText.parola[0];
            utilizNou.culoare_chat=campuriText.culoare_chat[0];
            utilizNou.poza= poza;
            Utilizator.getUtilizDupaUsername(campuriText.username[0], {}, function(u, parametru ,eroareUser ){
                if (eroareUser==-1){//nu exista username-ul in BD
                    //TO DO salveaza utilizator
                    utilizNou.salvareUtilizator()
                }
                else{
                    eroare+="Mai exista username-ul";
                }


                if(!eroare){
                    res.render("pagini/inregistrare", {raspuns:"Inregistrare cu succes!"})
                   
                }
                else
                    res.render("pagini/inregistrare", {err: "Eroare: "+eroare});
            })
           


        }
        catch(e){
            console.log(e);
            eroare+= "Eroare site; reveniti mai tarziu";
            console.log(eroare);
            res.render("pagini/inregistrare", {err: "Eroare: "+eroare})
        }
   

    });
    formular.on("field", function(nume,val){  // 1
   
        console.log(`--- ${nume}=${val}`);
       
        if(nume=="username")
            username=val;
    })
    formular.on("fileBegin", function(nume,fisier){ //2
        console.log("fileBegin");
       
        console.log(nume,fisier);
        //TO DO adaugam folderul poze_uploadate ca static si sa fie creat de aplicatie
        //TO DO in folderul poze_uploadate facem folder cu numele utilizatorului (variabila folderUser)
        var folderUser=path.join(__dirname, "poze_uploadate", username);
        if (!fs.existsSync(folderUser))
            fs.mkdirSync(folderUser)
       
        fisier.filepath=path.join(folderUser, fisier.originalFilename)
        poza=fisier.originalFilename;
        //fisier.filepath=folderUser+"/"+fisier.originalFilename
        console.log("fileBegin:",poza)
        console.log("fileBegin, fisier:",fisier)


    })    
    formular.on("file", function(nume,fisier){//3
        console.log("file");
        console.log(nume,fisier);
    });
});



app.get(/^\/resurse\/[a-zA-Z0-9_\/]*$/, function(req, res, next){
    afisareEroare(res,403);
})

// 1. Servește resursele statice PRIMELE
app.use("/resurse", function(req, res, next) {
  const fullPath = path.join(__dirname, "resurse", req.url);

  try {
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      if (!req.url.endsWith("/")) {
        afisareEroare(res, 403, "Acces interzis", "Adaugă / la finalul directorului.");
        return;
      }
    }
  } catch (err) {
    console.error("Eroare verificare folder:", err);
  }

  next();
}, express.static(path.join(__dirname, "resurse"))); // <--- important să fie PRIMUL

// 2. Pagini dinamice .ejs


// 3. Rută fallback pentru 404
app.use((req, res) => {
  afisareEroare(res, 404, "Pagina nu a fost găsită", "Verifică URL-ul introdus.");
});

// Start the server after initializing the gallery.
(async () => {
  try {
    await initGallery();
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      console.log("Serverul a pornit");
    });
  } catch (err) {
    console.error("Error during initGallery:", err.stack || err);
  }
})();