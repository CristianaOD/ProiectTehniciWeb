const express = require("express"); /* cere un pachet - require; defineste o constanta; express- creaza un ob de tip server */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const sass = require('sass');
const ejs = require('ejs');

obGlobal = {  /*pentru ob global variabile globale -> prop:var*/
    obErori: null,
    obImagini: null,
    //etapa 5 a
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    //etapa 5 c
    folderBackup: path.join(__dirname, "backup")
}

app = express(); /*obiect de tip server */

/*etapa 4 - ex3 */
console.log("Folder proiect", __dirname); /*afiseaza in consola*/
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

//etapa4 - ex20 + etapa5 c
//pune argument, fara +"/"+
vectorFoldere = ["temp", "temp1", "backup"]
for (let folder of vectorFoldere) {
    //let caleFolder=__dirname+"/"+folder;
    let caleFolder = path.join(__dirname, folder)
    if (!fs.existsSync(caleFolder)) { //nu (exista in mod sincron, nu trebuie callback)
        fs.mkdirSync(caleFolder); //creaza director in mod sincron
    }

}

//etapa 5 b
/*sa nu compilam manual de fiecare data scss*/
function compileazaScss(caleScss, caleCss) {
    console.log("cale:", caleCss);
    if (!caleCss) { /*undifind*/ /*lista cu fi+olderele din cale*/
        let vectorCale = caleScss.split("\\")
        let numeFisExt = vectorCale[vectorCale.length - 1]; /*cu extensie*/

        let numeFis = numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
        caleCss = numeFis + ".css";
    }

    if (!path.isAbsolute(caleScss)) //nu e cale absoluta, pun fisierele chiar in folderele absolute; /,#
        caleScss = path.join(obGlobal.folderScss, caleScss)
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss)

    // la acest punct avem cai absolute in caleScss si  caleCss
    let vectorCale = caleCss.split("\\");
    let numeFisCss = vectorCale[vectorCale.length - 1];
    //etapa 5 d
    if (fs.existsSync(caleCss)) { /*copiere in backup daca exista fisierul css*/
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, numeFisCss))// +(new Date()).getTime()
    }
    /*ob cu prop css, e string rezultat din cod css*/
    rez = sass.compile(caleScss, { "sourceMap": true }); /*vad linia din fisierul sass, chiar daca browserul nu primeste fisierul sass*/
    fs.writeFileSync(caleCss, rez.css)
    console.log("Compilare SCSS", rez);
}
//compileazaScss("a.scss");
//etapa 5 e
/*verifica daca au suvernit schimbari; din scss sa l fac css*/
fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
    console.log(eveniment, numeFis);
    if (eveniment == "change" || eveniment == "rename") {
        let caleCompleta = path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)) {
            compileazaScss(caleCompleta);
        }
    }
})

app.set("view engine", "ejs");

app.set("view engine", "ejs"); /*foloseste ejs ca un motor de template */

//etapa 4 - ex6
app.use("/resurse", express.static(__dirname + "/resurse")); /*ob de tip functie- trebuie sa zic calea - livreaza toate resursele*/
app.use("/node_modules", express.static(__dirname + "/node_modules"));

/*trebuie sa se potriveasca cu inceputul */
//etapa4 -ex17
app.use(/^\/resurse(\/[a-zA-Z0-9]*)*$/, function (req, res) {
    afisareEroare(res, 403);
});

//etapa 4 - ex18
app.get("/favicon.ico", function (req, res) {
    res.sendFile(__dirname + "/resurse/ico/favicon.ico")
})

//cere calea exacta
// app.get("/ceva", function(req, res){
//     console.log("cale:",req.url)
//     res.send("<h1>altceva</h1> ip:"+req.ip); /*vreau raspunsul ::1 - are pt ip host*/
// })

//etapa4 - ex8 + ex16
app.get(["/index", "/", "/home", " "], function (req, res) { /*vector de alias uri de pagini */
    res.render("pagini/index", { ip: req.ip, imagini: obGlobal.obImagini.imagini }); /*definesc proprietati ale lui locals */
})

//etapa 4 - ex19
// /\.ejs$ - orice se termina cu .ejs
app.get("/*.ejs", function (req, res) {
    afisareEroare(res, 400);
})

//etapa 4 - ex9 + ex10
app.get("/*", function (req, res) {
    try {
        res.render("pagini" + req.url, function (err, rezRandare) {
            if (err) {
                console.log(err);
                if (err.message.startsWith("Failed to lookup view"))
                    //afisareEroare(res,{_identificator:404, _titlu:"ceva"});
                    afisareEroare(res, 404);
                else
                    afisareEroare(res);
            }
            else {
                console.log(rezRandare);
                res.send(rezRandare);
            }
        });
    } catch (err) {
        if (err.message.startsWith("Cannot find module"))
            //afisareEroare(res,{_identificator:404, _titlu:"ceva"});
            afisareEroare(res, 404, "Fisier resursa negasit");
        else
            afisareEroare(res);
    }
})

app.get("/*", function (req, res) {
    res.render("pagini" + req.url, function (err, rezRandare) { //ca sa mearga pentru orice pagina; functie callback, seteaza parametrul de eroare, sau rezultatul randarii 
        if (err) { //setat cand am eroare, nu gaseste pagina 
            console.log(err); //vedem eroarea in consola
            if (err.message.startsWith("Failed to lookup view"))
                //afisareEroare(res,{_identificator:404, _titlu:"ceva"});
                afisareEroare(res, 404, "titlu costume"); //daca nu pun nimic, apare cel din json
            else
                afisareEroare(res);
        }
        else {
            console.log(rezRandare);
            res.send(rezRandare);
        }
    });
})

//functia asincrona e programata; isi asteapta randul in bucla de evenimente
//__dirname -folderul proiectului
//etapa 4 - ex 13
function initErori() {
    var continut = fs.readFileSync(__dirname + "/resurse/json/erori.json").toString("utf-8"); /*var locala: var, let -domeniu de vizibilitate e intre {} unde e def */
    console.log(continut);
    obGlobal.obErori = JSON.parse(continut);//parseaza json ul -> devine din string in ob java string
    let vErori = obGlobal.obErori.info_erori;
    //for (let i=0; i< vErori.length; i++ )
    // for (let eroare of vErori){
    //     eroare.imagine="/"+obGlobal.obErori.cale_baza+"/"+eroare.imagine;
    // }
}
initErori();

/*
function initImagini(){
    var continut= fs.readFileSync(__dirname+"/resurse/json/galerie.json").toString("utf-8"); 
    
    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;

    let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie, "mediu"); //folder cu imag de dimensiunie medie
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);

    //for (let i=0; i< vErori.length; i++ )
    for (let imag of vImagini){
        [numeFis, ext]=imag.fisier.split(".");
        let caleFisAbs=path.join(caleAbs,imag.fisier);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        sharp(caleFisAbs).resize(400).toFile(caleFisMediuAbs);
        imag.fisier_mediu=path.join("/", obGlobal.obImagini.cale_galerie, "mediu", numeFis+".webp" )
        imag.fisier=path.join("/", obGlobal.obImagini.cale_galerie, imag.fisier ) //ultimul pt ca am nevoie de numele fis nemodificat
        //eroare.imagine="/"+obGlobal.obErori.cale_baza+"/"+eroare.imagine;
    }
}
initImagini();
*/
function initializeazaImagini() {  // citeste fisierul json
    var continut = fs.readFileSync(__dirname + "/resurse/json/galerie.json").toString("utf-8");
    obGlobal.obImagini = JSON.parse(continut);  // parsare -> identifica proprietatile si valorile din json
    let vImagini = obGlobal.obImagini.imagini;
    let caleAbs = path.join(__dirname, obGlobal.obImagini.cale_galerie);
    let caleAbsMediu = path.join(__dirname, obGlobal.obImagini.cale_galerie, "mediu");  // folder in care vom crea imag de dimensiune medie
    let caleAbsMic = path.join(__dirname, obGlobal.obImagini.cale_galerie, "mic");
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);
    if (!fs.existsSync(caleAbsMic))
        fs.mkdirSync(caleAbsMic);
    for (let imag of vImagini) {
        [numeFis, ext] = imag.fisier.split(".");
        let caleFisAbs = path.join(caleAbs, imag.fisier);
        let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");
        let caleFisMicAbs = path.join(caleAbsMic, numeFis + ".webp");
        sharp(caleFisAbs).resize(400).toFile(caleFisMediuAbs);
        sharp(caleFisAbs).resize(200).toFile(caleFisMicAbs);

        imag.fisier_mediu = path.join("/", obGlobal.obImagini.cale_galerie, "mediu", numeFis + ".webp")
        imag.fisier = path.join("/", obGlobal.obImagini.cale_galerie, imag.fisier)
    }
}
initializeazaImagini();

//function afisareEroare(res, {_identificator, _titlu, _text, _imagine}={} ){
//etapa4 -ex14
function afisareEroare(res, _identificator, _titlu = "EROARE", _text, _imagine) {

    let vErori = obGlobal.obErori.info_erori;
    let eroare = vErori.find(function (elem) { return elem.identificator == _identificator; });
    if (eroare) {
        let titlu1 = _titlu == "EROARE" ? (eroare.titlu || _titlu) : _titlu;
        let text1 = _text || eroare.text;
        let imagine1 = _imagine || eroare.imagine;
        if (eroare.status)
            res.status(eroare.identificator).render("pagini/eroare", { titlu: titlu1, text: text1, imagine: imagine1 });
        else
            res.render("pagini/eroare", { tiltu: titlu1, text: text1, imagine: imagine1 });

    }
    else {
        let errDef = obGlobal.obErori.eroare_default;
        res.render("pagini/eroare", { tiltu: errDef.titlu, text: errDef.text, imagine: obGlobal.obErori.cale_baza + "/" + errDef.imagine });
    }
}

/*etapa4 - ex2*/
app.listen(8080);
console.log("Serverul a pornit");

