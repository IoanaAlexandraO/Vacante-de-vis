// Importăm obiectul Drepturi din fișierul extern 'drepturi.js'
const Drepturi = require('./drepturi.js');

// Definim clasa de bază pentru orice rol
class Rol {
    // Metodă statică: definește tipul general al rolului (folosit în clasele copil)
    static get tip() { return "generic"; }

    // Metodă statică: definește drepturile (niciunul în cazul generic)
    static get drepturi() { return []; }

    // Constructorul setează codul rolului pe baza tipului clasei
    constructor() {
        this.cod = this.constructor.tip;
    }

    // Verifică dacă un rol are un anumit drept
    areDreptul(drept) {
        return this.constructor.drepturi.includes(drept);
    }
}

// Clasa pentru rolul de administrator
class RolAdmin extends Rol {
    // Tipul pentru acest rol este "admin"
    static get tip() { return "admin"; }

    // Constructorul apelează constructorul din clasa de bază
    constructor() { super(); }

    // Adminul are automat toate drepturile
    areDreptul() {
        return true;
    }
}

// Clasa pentru rolul de moderator
class RolModerator extends Rol {
    // Tipul pentru acest rol este "moderator"
    static get tip() { return "moderator"; }

    // Lista de drepturi specifice moderatorului
    static get drepturi() {
        return [
            Drepturi.vizualizareUtilizatori,
            Drepturi.stergereUtilizatori,
            Drepturi.modificareUtilizatori,
            Drepturi.adaugareUtilizatori
        ];
    }

    // Constructorul apelează constructorul clasei părinte
    constructor() { super(); }
}

// Clasa pentru rolul de client obișnuit
class RolClient extends Rol {
    // Tipul pentru acest rol este "comun"
    static get tip() { return "comun"; }

    // Drepturile pe care le are un client
    static get drepturi() {
        return [
            Drepturi.cumparareProduse,
            Drepturi.vizualizareProduse
        ];
    }

    // Constructorul apelează constructorul clasei părinte
    constructor() { super(); }
}

// Clasă care creează obiecte de tip rol în funcție de stringul primit
class RolFactory {
    // Metodă statică ce primește un tip de rol și returnează instanța corespunzătoare
    static creeazaRol(tip) {
        switch (tip) {
            case RolAdmin.tip: return new RolAdmin();         // dacă e "admin"
            case RolModerator.tip: return new RolModerator(); // dacă e "moderator"
            case RolClient.tip: return new RolClient();       // dacă e "comun"
            default: return new Rol();                        // altceva = generic
        }
    }
}

// Exportăm toate clasele pentru a fi folosite în alte fișiere
module.exports = {
    RolFactory,
    RolAdmin,
    RolModerator,
    RolClient
};
