class Vacanta{

    constructor({nume, descriere, imagine, categorie, dificultate, pret, durata_zile, data_disponibilitate, pasaport_necesar, activitati, transport_inclus}={}) {

        for(let prop in arguments[0]){
            this[prop]=arguments[0][prop]
        }

    }

}