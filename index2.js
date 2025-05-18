const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const sass = require('sass');
const app = express();
const port = 8080;
const sharp = require('sharp');

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

// Function to compile SCSS to CSS with backup
async function compileazaScss(caleScss, caleCss) {
  const scssAbs = path.isAbsolute(caleScss)
    ? caleScss
    : path.join(obiectGlobal.folderScss, caleScss);

  const cssAbs = caleCss
    ? (path.isAbsolute(caleCss) ? caleCss : path.join(obiectGlobal.folderCss, caleCss))
    : path.join(obiectGlobal.folderCss, path.basename(scssAbs, ".scss") + ".css");

  const backupPath = path.join(obiectGlobal.folderBackup, "resurse/scss");
  await fsp.mkdir(backupPath, { recursive: true });

  try {
    if (fs.existsSync(cssAbs)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const numeFisier = path.basename(cssAbs, ".css");
      const caleBackup = path.join(backupPath, `${numeFisier}_${timestamp}.css`);
      await fsp.copyFile(cssAbs, caleBackup);
    }

    const rezultat = sass.compile(scssAbs, { style: "expanded" });
    await fsp.writeFile(cssAbs, rezultat.css);
    console.log(`[SCSS] Compilat: ${scssAbs} -> ${cssAbs}`);
  } catch (err) {
    console.error(`[Eroare] La compilarea ${scssAbs}:`, err.message);
  }
}

// Compile all SCSS files
function compileazaToateScss() {
  const fisiere = fs.readdirSync(obiectGlobal.folderScss).filter(f => f.endsWith(".scss"));
  for (let f of fisiere) {
    compileazaScss(f);
  }
}

// Initial compilation of all SCSS files
compileazaToateScss();

// Watch SCSS folder for changes
fs.watch(obiectGlobal.folderScss, (event, filename) => {
  if (filename && filename.endsWith(".scss")) {
    console.log(`[SCSS] Detectat eveniment: ${event} pe ${filename}`);
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

// Middleware to add IP to locals
app.use(function (req, res, next) {
  res.locals.ip = req.ip;
  next();
});

// Serve static files from the 'resurse' directory with directory checks
app.use("/resurse", function (req, res, next) {
  const fullPath = path.join(__dirname, "resurse", req.url);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    if (!req.url.endsWith("/")) {
      afisareEroare(res, 403);
      return;
    }
  }
  next();
}, express.static(path.join(__dirname, "resurse")));

// Route for home page (multiple path variants) with gallery data
app.get(['/', '/index', '/home'], function (req, res) {
  const ip = req.ip;

  res.render('pagini/index', {
    ip: req.ip,
    imagini: obGlobal.obImagini.imagini,
    cale_galerie: obGlobal.obImagini.cale_galerie
  });
});

// Function to process images into "mic" folder only
async function initGallery() {
  // Read gallery JSON
  const galleryPath = path.join(__dirname, 'resurse/json/galerie.json');
  const galleryData = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));

  // Validate JSON structure
  if (!galleryData?.cale_galerie || !Array.isArray(galleryData?.imagini)) {
    throw new Error("Invalid gallery JSON structure");
  }

  // Prepare paths
  const galerieFolder = path.join(__dirname, galleryData.cale_galerie);
  const smallFolder = path.join(galerieFolder, "mic");

  // Create small folder ("mic") if it doesn't exist
  if (!fs.existsSync(smallFolder)) {
    fs.mkdirSync(smallFolder, { recursive: true });
    console.log("Created small folder:", smallFolder);
  } else {
    console.log("Small folder already exists:", smallFolder);
  }

  // Simulăm data și ora pentru test
  const currentDate = new Date("2025-05-12T08:50:00");
  console.log("Simulated current date:", currentDate);

  const currentMinutes = currentDate.getMinutes();
  console.log("Current minutes:", currentMinutes);

  let currentQuarter;
  if (currentMinutes < 15) {
    currentQuarter = "1"; // între oră fixă și 15 minute
  } else if (currentMinutes < 30) {
    currentQuarter = "2"; // între 15 și 30 minute
  } else if (currentMinutes < 45) {
    currentQuarter = "3"; // între 30 și 45 minute
  } else {
    currentQuarter = "4"; // între 45 și 60 minute
  }
  console.log("Determined current quarter:", currentQuarter);

  // Process each image (resize to width 300px)
  const processedImages = [];
  const promises = galleryData.imagini.map(async image => {
                                                        if (!image?.cale_relativa) {
                                                          console.warn("Skipping image - missing cale_relativa:", image);
                                                          return;
                                                        }

                                                        const [fileName, fileExt] = image.cale_relativa.split('.');
                                                        const sourcePath = path.join(galerieFolder, image.cale_relativa);
                                                        const targetPath = path.join(smallFolder, `${fileName}.webp`);

                                                        if (!fs.existsSync(sourcePath)) {
                                                          console.warn("Source image not found:", sourcePath);
                                                          return;
                                                        }

                                                        try {
                                                          await sharp(sourcePath)
                                                            .resize({ width: 300 })
                                                            .webp()
                                                            .toFile(targetPath);

                                                          console.log("Processed image:", image.cale_relativa);

                                                          processedImages.push({
                                                            ...image,
                                                            fisier_mic: `/${galleryData.cale_galerie}/mic/${fileName}.webp`
                                                          });
                                                        } catch (err) {
                                                          console.error(`Error processing image ${image.cale_relativa}:`, err);
                                                        }
                                                      });

  await Promise.all(promises);
  console.log("Successfully processed", processedImages.length, "images");

  // Update the global object with processed images
  obGlobal.obImagini = {
    cale_galerie: galleryData.cale_galerie,
    imagini: processedImages.filter(img => img.sfert_ora === currentQuarter),
    currentQuarter: currentQuarter
  };

  return processedImages;
}

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