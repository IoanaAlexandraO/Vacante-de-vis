// Importăm din pachetul 'pg' clasele Client și Pool
// 'Client' se folosește pentru conexiune simplă la baza de date PostgreSQL
const {Client, Pool} = require("pg");

// Definim clasa AccesBD care se ocupă de conexiunea și interacțiunea cu baza de date
class AccesBD {
    // Variabile private statice pentru Singleton
    static #instanta = null;        // va ține instanța unică a clasei
    static #initializat = false;    // verifică dacă e pregătită să creeze instanța

    // Constructorul clasei
    constructor() {
        // Dacă deja există o instanță, nu permite crearea altei instanțe
        if (AccesBD.#instanta) {
            throw new Error("Deja a fost instantiat");
        }
        // Dacă nu s-a făcut inițializarea (nu s-a apelat corect prin getInstanta), dă eroare
        else if (!AccesBD.#initializat) {
            throw new Error("Trebuie apelat doar din getInstanta; fara sa fi aruncat vreo eroare");
        }
    }

    // Inițializează conexiunea locală la baza de date
    initLocal() {
        // Creează un client PostgreSQL conectat la baza 'proiect_bd'
        this.client = new Client({
            database: "proiect_bd",
            user: "alexandra",
            password: "Alexandra8",
            host: "localhost",
            port: 5432
        });

        // Face efectiv conectarea
        this.client.connect();
    }

    // Returnează clientul activ de conectare
    getClient() {
        // Dacă nu s-a creat instanța, aruncă eroare
        if (!AccesBD.#instanta) {
            throw new Error("Nu a fost instantiata clasa");
        }
        // Altfel, returnează clientul conectat
        return this.client;
    }

    // === DOC TIP DEFINIT (JSdoc) ===
    /**
     * Returnează instanța unică a clasei AccesBD
     * Poate primi opțional tipul de inițializare (ex: 'local')
     */
    static getInstanta({init = "local"} = {}) {
        console.log(this); // aici 'this' este clasa, nu o instanță

        // Dacă nu s-a creat încă instanța, o creăm
        if (!this.#instanta) {
            this.#initializat = true;
            this.#instanta = new AccesBD();

            // Încearcă inițializarea clientului în funcție de tipul primit
            try {
                switch (init) {
                    case "local":
                        this.#instanta.initLocal();
                }
            } catch (e) {
                console.error("Eroare la initializarea bazei de date!");
            }
        }

        // Returnează instanța unică
        return this.#instanta;
    }

    /**
     * Selectează date din baza de date
     * @param {object} obj Obiect care conține tabelul, coloanele și condițiile
     * @param {function} callback Funcție care primește rezultatul sau eroarea
     * @param {Array} parametriQuery Lista de valori pentru query parametrizat (opțional)
     */
    select({tabel = "", campuri = [], conditiiAnd = []} = {}, callback, parametriQuery = []) {
        // Creează clauza WHERE dacă avem condiții
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        // Creează comanda SQL de tip SELECT
        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.error(comanda); // o afișăm pentru debugging

        // Execută comanda
        this.client.query(comanda, parametriQuery, callback);
    }

    // Versiune async (cu await) a metodei SELECT
    async selectAsync({tabel = "", campuri = [], conditiiAnd = []} = {}) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.error("selectAsync:", comanda);

        try {
            // Execută comanda și așteaptă rezultatul
            let rez = await this.client.query(comanda);
            console.log("selectasync: ", rez);
            return rez;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    // Inserează o înregistrare în baza de date
    insert({tabel = "", campuri = {}} = {}, callback) {
        console.log("-------------------------------------------");
        // Afișează cheile și valorile primite
        console.log(Object.keys(campuri).join(","));
        console.log(Object.values(campuri).join(","));

        // Creează comanda SQL INSERT
        let comanda = `insert into ${tabel}(${Object.keys(campuri).join(",")}) values (${Object.values(campuri).map((x) => `'${x}'`).join(",")})`;
        console.log(comanda);

        // Execută comanda
        this.client.query(comanda, callback);
    }

    // Actualizează o înregistrare (versiune simplă, nu parametrizată)
    update({tabel = "", campuri = {}, conditiiAnd = []} = {}, callback, parametriQuery) {
        let campuriActualizate = [];
        for (let prop in campuri)
            campuriActualizate.push(`${prop}='${campuri[prop]}'`);

        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        let comanda = `update ${tabel} set ${campuriActualizate.join(", ")} ${conditieWhere}`;
        console.log(comanda);

        // Execută comanda
        this.client.query(comanda, callback);
    }

    // Actualizează o înregistrare (versiune parametrizată)
    updateParametrizat({tabel = "", campuri = [], valori = [], conditiiAnd = []} = {}, callback, parametriQuery) {
        // Verifică dacă avem același număr de câmpuri și valori
        if (campuri.length != valori.length)
            throw new Error("Numarul de campuri difera de nr de valori");

        // Creează expresiile de tip camp=$1, camp2=$2 etc.
        let campuriActualizate = [];
        for (let i = 0; i < campuri.length; i++)
            campuriActualizate.push(`${campuri[i]}=$${i + 1}`);

        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        let comanda = `update ${tabel} set ${campuriActualizate.join(", ")} ${conditieWhere}`;
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1111", comanda);

        // Execută comanda cu valori parametrizate
        this.client.query(comanda, valori, callback);
    }

    // Șterge înregistrări din baza de date
    delete({tabel = "", conditiiAnd = []} = {}, callback) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        let comanda = `delete from ${tabel} ${conditieWhere}`;
        console.log(comanda);

        this.client.query(comanda, callback);
    }

    // Execută un query SQL simplu (orice fel de comandă)
    query(comanda, callback) {
        this.client.query(comanda, callback);
    }
}

// Exportă clasa pentru a putea fi folosită în alte fișiere
module.exports = AccesBD;
