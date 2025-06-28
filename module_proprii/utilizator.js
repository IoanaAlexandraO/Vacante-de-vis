// Importăm clasa AccesBD, care se ocupă cu interacțiunea cu baza de date
// AccesBD este responsabilă pentru gestionarea conexiunii și execuția query-urilor
const AccesBD = require('./accesbd.js');

// Importăm modulul parole.js care probabil generează token-uri pentru confirmarea emailurilor
const parole = require('./parole.js');

// Importăm clasa RolFactory care ajută la crearea rolurilor utilizatorilor (admin, moderator, client)
const { RolFactory } = require('./roluri.js');

// Importăm modulul crypto, care este folosit pentru criptarea parolelor utilizatorilor
const crypto = require("crypto");

// Importăm nodemailer pentru trimiterea emailurilor, folosit pentru trimiterea notificărilor sau confirmărilor
const nodemailer = require("nodemailer");

// Clasa Utilizator modelează un utilizator al aplicației și conține funcționalitățile pentru gestionarea datelor utilizatorului
class Utilizator {
    // Variabile statice care sunt comune pentru toți utilizatorii (valori constante)
    static tipConexiune = "local"; // Tipul conexiunii la baza de date
    static tabel = "utilizatori";  // Numele tabelului în baza de date
    static parolaCriptare = "tehniciweb"; // Cheia de criptare pentru parole
    static emailServer = "test.tweb.node@gmail.com"; // Emailul serverului pentru trimiterea de notificări
    static lungimeCod = 64; // Lungimea codului generat pentru utilizator (folosit pentru token-uri)
    static numeDomeniu = "localhost:8080"; // Domeniul la care se trimite link-ul de confirmare

    // Variabilă privată pentru stocarea erorilor
    #eroare;

    // Constructorul clasei Utilizator primește un obiect cu datele utilizatorului și le setează
    constructor({ id, username, nume, prenume, email, parola, rol, culoare_chat = "black", poza } = {}) {
        this.id = id;

        // Verificăm dacă username-ul este valid. Dacă nu, aruncăm eroare.
        try {
            if (this.checkUsername(username))
                this.username = username;
            else
                throw new Error("Username incorect");
        }
        catch (e) {
            // Dacă apare o eroare, salvăm mesajul de eroare în variabila privată
            this.#eroare = e.message;
        }

        // Setăm toate proprietățile utilizatorului din obiectul primit
        for (let prop in arguments[0]) {
            this[prop] = arguments[0][prop];
        }

        // Dacă rolul este furnizat, transformăm codul rolului într-un obiect de tip Rol
        if (this.rol)
            this.rol = this.rol.cod ? RolFactory.creeazaRol(this.rol.cod) : RolFactory.creeazaRol(this.rol);

        console.log(this.rol); // Afișăm rolul în consolă
        this.#eroare = ""; // Resetăm eroarea
    }

    // Verifică dacă numele este valid (primul caracter mare și restul litere mici)
    checkName(nume) {
        return nume != "" && nume.match(new RegExp("^[A-Z][a-z]+$"));
    }

    // Setter pentru numele utilizatorului cu validare
    set setareNume(nume) {
        if (this.checkName(nume)) this.nume = nume;
        else throw new Error("Nume gresit"); // Aruncăm eroare dacă nu este valid
    }

    // Setter pentru username cu validare
    set setareUsername(username) {
        if (this.checkUsername(username)) this.username = username;
        else throw new Error("Username gresit"); // Aruncăm eroare dacă nu este valid
    }

    // Verifică dacă username-ul este valid (litere, cifre, #, _, ., / sunt permise)
    checkUsername(username) {
        return username != "" && username.match(new RegExp("^[A-Za-z0-9#_./]+$"));
    }

    // Criptează parola folosind algoritmul scryptSync (metoda de criptare a parolelor)
    // Returnează un șir hexadecimal care reprezintă parola criptată
    static criptareParola(parola) {
        return crypto.scryptSync(parola, Utilizator.parolaCriptare, Utilizator.lungimeCod).toString("hex");
    }

   salvareUtilizator() {
    // Criptează parola utilizatorului curent folosind funcția statică definită în clasă
    let parolaCriptata = Utilizator.criptareParola(this.parola);

    // Salvăm o referință la obiectul curent (this) pentru a-l putea folosi în callback
    let utiliz = this;

    // Generăm un token unic (ex: cod de activare cont prin email)
    let token = parole.genereazaToken(100);

    // Obținem o conexiune la baza de date și apelăm metoda insert din AccesBD
    AccesBD.getInstanta(Utilizator.tipConexiune).insert({
        tabel: Utilizator.tabel, // inserăm în tabelul "utilizatori"
        campuri: { // definim coloanele și valorile de inserat
            username: this.username,
            nume: this.nume,
            prenume: this.prenume,
            parola: parolaCriptata,
            email: this.email,
            culoare_chat: this.culoare_chat,
            cod: token, // codul de activare
            poza: this.poza
        }
    }, function (err, rez) {
        // Dacă apare eroare la salvare, o afișăm
        if (err)
            console.log(err);
        else
            // Dacă salvarea a reușit, trimitem un email de confirmare cu link și token
            utiliz.trimiteMail(
                "Te-ai inregistrat cu succes",
                "Username-ul tau este " + utiliz.username,
                `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${utiliz.username}.</p>
                <p><a href='http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}'>Click aici pentru confirmare</a></p>`
            );
    });
}


    // Trimite un email utilizând nodemailer
    // Aceasta metodă folosește contul de Gmail pentru a trimite emailuri
    async trimiteMail(subiect, mesajText, mesajHtml, atasamente = []) {
        var transp = nodemailer.createTransport({
            service: "gmail", // folosim Gmail pentru trimiterea emailurilor
            secure: false,
            auth: {
                user: Utilizator.emailServer, // contul Gmail
                pass: "rwgmgkldxnarxrgu" // parola contului (trebuie înlocuită cu o parolă reală)
            },
            tls: { rejectUnauthorized: false }
        });

        // Trimitem email-ul
        await transp.sendMail({
            from: Utilizator.emailServer,
            to: this.email, // Destinatarul emailului (adresă salvată pe utilizator)
            subject: subiect,
            text: mesajText,
            html: mesajHtml,
            attachments: atasamente
        });

        console.log("trimis mail"); // Afișăm un mesaj în consolă după trimiterea emailului
    }

    // Găsește un utilizator după username, folosind metoda asincronă
    static async getUtilizDupaUsernameAsync(username) {
        if (!username) return null; // Dacă username-ul nu este valid, returnăm null
        try {
            // Executăm un query pentru a căuta utilizatorul în baza de date
            let rezSelect = await AccesBD.getInstanta(Utilizator.tipConexiune).selectAsync({
                tabel: "utilizatori",
                campuri: ['*'],
                conditiiAnd: [`username='${username}'`]
            });

            // Dacă utilizatorul există, returnăm un obiect Utilizator
            if (rezSelect.rowCount != 0)
                return new Utilizator(rezSelect.rows[0]);
            else {
                console.log("getUtilizDupaUsernameAsync: Nu am gasit utilizatorul");
                return null;
            }
        } catch (e) {
            console.log(e); // Dacă apare eroare, o afișăm
            return null;
        }
    }

    // Găsește un utilizator după username folosind un callback pentru procesare
    static getUtilizDupaUsername(username, obparam, proceseazaUtiliz) {
        if (!username) return null; // Dacă username-ul nu este valid, returnăm null
        let eroare = null;

        // Executăm un query pentru a căuta utilizatorul în baza de date
        AccesBD.getInstanta(Utilizator.tipConexiune).select({
            tabel: "utilizatori",
            campuri: ['*'],
            conditiiAnd: [`username='${username}'`]
        }, function (err, rezSelect) {
            if (err) {
                console.error("Utilizator:", err); // Dacă apare eroare, o afișăm
                eroare = -2; // Setăm eroarea
            } else if (rezSelect.rowCount == 0) {
                eroare = -1; // Dacă nu găsim utilizatorul, setăm eroarea
            }

            // Creăm un obiect Utilizator din datele găsite
            let u = new Utilizator(rezSelect.rows[0]);
            proceseazaUtiliz(u, obparam, eroare); // Apelăm callback-ul cu obiectul utilizator și eroarea
        });
    }

    // Verifică dacă utilizatorul are un anumit drept, apelând metoda 'areDreptul' pe rol
    areDreptul(drept) {
        return this.rol.areDreptul(drept);
    }

    // Modifică datele utilizatorului asincron
    async modifica(dateNoi) {
        if (!this.id) throw new Error("Utilizatorul nu există (id lipsă)");

        let updateObj = {};
        // Setăm datele care se pot modifica (username, nume, prenume, etc.)
        for (let prop in dateNoi) {
            if (["username", "nume", "prenume", "parola", "email", "culoare_chat", "poza"].includes(prop))
                updateObj[prop] = dateNoi[prop];
        }

        // Dacă parola este inclusă în datele noi, o criptăm
        if (updateObj.parola)
            updateObj.parola = Utilizator.criptareParola(updateObj.parola);

        // Executăm query-ul de actualizare în baza de date
        let rez = await AccesBD.getInstanta(Utilizator.tipConexiune).updateAsync({
            tabel: Utilizator.tabel,
            campuri: updateObj,
            conditiiAnd: [`id=${this.id}`]
        });

        // Dacă nu s-au făcut modificări, aruncăm eroare
        if (rez.rowCount === 0)
            throw new Error("Nu s-a modificat nimic");
    }

   async sterge() {
    // Verificăm dacă utilizatorul are un id (altfel nu știm ce să ștergem)
    if (!this.id) throw new Error("Utilizatorul nu există (id lipsă)");

    // Apelăm metoda deleteAsync din AccesBD cu condiția WHERE id=...
    let rez = await AccesBD.getInstanta(Utilizator.tipConexiune).deleteAsync({
        tabel: Utilizator.tabel, // ștergem din tabelul "utilizatori"
        conditiiAnd: [`id=${this.id}`] // condiția WHERE pentru ștergere
    });

    // Dacă nu s-a șters nicio linie, înseamnă că nu am găsit utilizatorul în BD
    if (rez.rowCount === 0)
        throw new Error("Nu s-a șters nimic");
}

    // Căutăm utilizatori în baza de date pe baza unor parametri,obparam obiect generic cu proprietăți
   static cauta(obParam, callback) {
    // Inițializăm un array de condiții WHERE
    let conditii = [];

    // Parcurgem fiecare proprietate din obiectul primit (ex: {nume: "Ana"})
    for (let prop in obParam) {
        // Dacă valoarea nu este undefined, adăugăm condiția prop='valoare'
        if (obParam[prop] !== undefined) {
            conditii.push(`${prop}='${obParam[prop]}'`);
        }
    }

    // Apelăm metoda select din AccesBD pentru a face un SELECT * cu WHERE
    AccesBD.getInstanta(Utilizator.tipConexiune).select({
        tabel: Utilizator.tabel,   // din tabelul "utilizatori"
        campuri: ['*'],            // selectăm toate coloanele
        conditiiAnd: conditii      // adăugăm condițiile WHERE concatenate cu "AND"
    }, function (err, rezSelect) {
        // Dacă apare eroare, apelăm callback-ul cu eroarea și lista goală
        if (err) callback(err, []);
        else {
            // Transformăm fiecare rând găsit în obiect de tip Utilizator
            let lista = rezSelect.rows.map(u => new Utilizator(u));

            // Apelăm callback-ul cu null (fără eroare) și lista de utilizatori
            callback(null, lista);
        }
    });
}


    // Căutăm utilizatori asincron pe baza unor parametri
    static async cautaAsync(obParam) {
        let conditii = [];
        for (let prop in obParam) {
            if (obParam[prop] !== undefined) {
                conditii.push(`${prop}='${obParam[prop]}'`);
            }
        }

        // Executăm query-ul de selecție asincron
        let rez = await AccesBD.getInstanta(Utilizator.tipConexiune).selectAsync({
            tabel: Utilizator.tabel,
            campuri: ['*'],
            conditiiAnd: conditii
        });

        // Returnăm rezultatele ca obiecte Utilizator
        return rez.rows.map(u => new Utilizator(u));
    }
}

// Exportăm clasa pentru a o putea folosi în alte fișiere
module.exports = { Utilizator: Utilizator };
