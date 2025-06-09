DROP TYPE IF EXISTS categorie_mare;
DROP TYPE IF EXISTS nivel_dificultate;
DROP TYPE IF EXISTS culoare_pasaport;

CREATE TYPE categorie_mare AS ENUM('sejur', 'city-break', 'aventura', 'relaxare', 'cruise');
CREATE TYPE nivel_dificultate AS ENUM('usor', 'mediu', 'dificil');
CREATE TYPE culoare_pasaport AS ENUM('rosu', 'albastru', 'verde', 'negru');
DROP TABLE IF EXISTS vacante;

CREATE TABLE vacante (
    id SERIAL PRIMARY KEY,
    nume VARCHAR(100) NOT NULL,
    descriere TEXT,
    imagine VARCHAR(300),
    categorie categorie_mare NOT NULL,
    dificultate nivel_dificultate DEFAULT 'usor',
    pret NUMERIC(10,2) NOT NULL CHECK (pret > 0),
    durata_zile INT CHECK (durata_zile > 0),
    data_disponibilitate DATE NOT NULL,
    pasaport_necesar culoare_pasaport,
    activitati TEXT, -- valori multiple separate prin virgula
    transport_inclus BOOLEAN DEFAULT FALSE
);
INSERT INTO vacante (nume, descriere, imagine, categorie, dificultate, pret, durata_zile, data_disponibilitate, pasaport_necesar, activitati, transport_inclus) VALUES
('Sejur în Maldive', 'Relaxare totală pe plaje exotice.', 'maldive.jpg', 'relaxare', 'usor', 3200, 7, '2025-07-15', 'rosu', 'plaja, snorkeling, cocktailuri', TRUE),
('City-break Paris', '3 zile în orașul iubirii.', 'paris.jpg', 'city-break', 'usor', 750, 3, '2025-06-10', 'rosu', 'muzee, turnul eiffel, shopping', TRUE),
('Expediție în Nepal', 'Aventura vieții tale spre Everest Base Camp.', 'nepal.jpg', 'aventura', 'dificil', 2800, 12, '2025-09-01', 'verde', 'drumetii, catarat, spiritualitate', FALSE),
('Croazieră Mediteraneană', 'Croazieră cu opriri în Italia, Grecia și Franța.', 'croaziera.jpg', 'cruise', 'usor', 4000, 10, '2025-08-05', 'rosu', 'relaxare, vizite, gastronomie', TRUE),
('Vacanță în Thailanda', 'Explorează templele și gustă mâncăruri exotice.', 'thailanda.jpg', 'aventura', 'mediu', 1900, 8, '2025-11-20', 'rosu', 'temple, plaje, junglă, mâncare', FALSE),
('Weekend la Bran', 'Relaxare la munte într-o locație pitorească.', 'bran.jpg', 'relaxare', 'usor', 400, 2, '2025-07-01', NULL, 'drumetii, castel, relaxare', TRUE),
('Safari în Kenya', 'Aventura în savana africană.', 'safari.jpg', 'aventura', 'dificil', 3500, 9, '2025-10-12', 'verde', 'safari, poze, triburi, camping', FALSE),
('City-break Berlin', 'Explorare urbană și istorie modernă.', 'berlin.jpg', 'city-break', 'usor', 680, 3, '2025-06-18', 'rosu', 'muzee, buncăre, gastronomie', TRUE),
('Sejur în Dubai', 'Lux și shopping în inima deșertului.', 'dubai.jpg', 'sejur', 'usor', 2300, 6, '2025-12-05', 'rosu', 'shopping, safari urban, piscine', TRUE),
('Vacanță în Islanda', 'Călătorie printre ghețari și vulcani.', 'islanda.jpg', 'aventura', 'mediu', 2700, 7, '2025-08-25', 'albastru', 'natura, gheizere, nordul îndepărtat', FALSE),
('Croazieră fiorduri norvegiene', 'O croazieră spectaculoasă printre fiorduri.', 'fiorduri.jpg', 'cruise', 'usor', 4200, 11, '2025-07-10', 'albastru', 'navigatie, relaxare, gastronomie', TRUE),
('Sejur Grecia All-Inclusive', 'Vacanță relaxantă cu mâncare tradițională.', 'grecia.jpg', 'relaxare', 'usor', 1600, 7, '2025-08-01', 'rosu', 'plaja, relaxare, taverne', TRUE),
('Tur Balcani', 'Explorează Serbia, Muntenegru și Bosnia.', 'balcani.jpg', 'sejur', 'mediu', 1250, 6, '2025-09-15', NULL, 'vizite, gastronomie, culturi', TRUE),
('Tabără de supraviețuire', 'Test de rezistență în natură.', 'tabara.jpg', 'aventura', 'dificil', 500, 5, '2025-07-20', NULL, 'cazare cort, gătit, trasee', FALSE),
('Mini-vacanță la Roma', 'City-break pentru iubitorii de istorie.', 'roma.jpg', 'city-break', 'usor', 720, 4, '2025-06-28', 'rosu', 'istorie, ruine, pizza', TRUE);


-- Tabel pentru seturi de vacanțe
CREATE TABLE seturi (
    id SERIAL PRIMARY KEY,
    nume_set VARCHAR(100) NOT NULL,
    descriere_set TEXT
);

-- Tabel de legătură: seturi <-> vacante
CREATE TABLE asociere_set (
    id SERIAL PRIMARY KEY,
    id_set INT REFERENCES seturi(id) ON DELETE CASCADE,
    id_produs INT REFERENCES vacante(id) ON DELETE CASCADE
);


INSERT INTO seturi (nume_set, descriere_set) VALUES
('Relaxare Exotică', 'Pachet combinat pentru destinații de relaxare de vis.'),
('City Explorer', 'Set ideal pentru explorarea celor mai frumoase orașe.'),
('Aventură Extremă', 'Pachet pentru iubitorii de adrenalină și natură.'),
('Croaziere Premium', 'Combină croaziere luxoase pentru o vacanță completă.'),
('Vacanțe Mixte', 'Un mix între relaxare, aventură și explorare urbană.');


-- Set 1: Relaxare Exotică
INSERT INTO asociere_set (id_set, id_produs) VALUES
(1, 1),  -- Sejur în Maldive
(1, 12), -- Sejur Grecia All-Inclusive
(1, 6);  -- Weekend la Bran

-- Set 2: City Explorer
INSERT INTO asociere_set (id_set, id_produs) VALUES
(2, 2),  -- City-break Paris
(2, 8),  -- City-break Berlin
(2, 15); -- Mini-vacanță la Roma

-- Set 3: Aventură Extremă
INSERT INTO asociere_set (id_set, id_produs) VALUES
(3, 3),  -- Expediție în Nepal
(3, 7),  -- Safari în Kenya
(3, 14); -- Tabără de supraviețuire

-- Set 4: Croaziere Premium
INSERT INTO asociere_set (id_set, id_produs) VALUES
(4, 4),  -- Croazieră Mediteraneană
(4, 11); -- Croazieră fiorduri norvegiene

-- Set 5: Vacanțe Mixte
INSERT INTO asociere_set (id_set, id_produs) VALUES
(5, 5),  -- Vacanță în Thailanda
(5, 13), -- Tur Balcani
(5, 10); -- Vacanță în Islanda
