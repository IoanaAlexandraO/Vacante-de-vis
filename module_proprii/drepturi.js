
/**
 @typedef Drepturi
 @type {Object}
 @property {Symbol} vizualizareUtilizatori - Dreptul de a vizualiza utilizatorii
 @property {Symbol} stergereUtilizatori - Dreptul de a sterge utilizatorii
 @property {Symbol} modificareUtilizatori - Dreptul de a modifica utilizatorii
 @property {Symbol} adaugareUtilizatori - Dreptul de a adauga utilizatori
 @property {Symbol} cumparareProduse - Dreptul	 de a cumpara produse
 @property {Symbol} vizualizareProduse - Dreptul de a vizualiza produsele
 @property {Symbol} modificareProduse - Dreptul de a modifica produsele
 @property {Symbol} stergereProduse - Dreptul de a sterge produsele
 @property {Symbol} vizualizareGrafice - Dreptul de a vizualiza


/**
 * @name module.exports.Drepturi
 * @type Drepturi
 */
const Drepturi = {
	
    vizualizareUtilizatori: Symbol("vizualizareUtilizatori"),
    stergereUtilizatori: Symbol("stergereUtilizatori"),
    modificareUtilizatori: Symbol("modificareUtilizatori"),
    adaugareUtilizatori: Symbol("adaugareUtilizatori"),
    cumparareProduse: Symbol("cumparareProduse"),
    vizualizareProduse: Symbol("vizualizareProduse"),
    modificareProduse: Symbol("modificareProduse"),
    stergereProduse: Symbol("stergereProduse"),
    vizualizareGrafice: Symbol("vizualizareGrafice")


}

module.exports=Drepturi;