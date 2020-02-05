// ==UserScript==
// @name         Fitxatge
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Plugin no oficial eina fitxatge
// @author       You
// @match        https://fitxatge.csuc.cat/marcajes.php
// @grant        none
// @updateURL   https://raw.githubusercontent.com/kerojohan/tamperfitxatge/master/fitxatge.js
// @downloadURL https://raw.githubusercontent.com/kerojohan/tamperfitxatge/master/fitxatge.js
// ==/UserScript==
function isPastDate(dateText) {
    var inputDate = dateText.split(" ");
    inputDate = inputDate[0].split("-");
    var today = new Date();
    inputDate = new Date(inputDate[0], inputDate[1] - 1, inputDate[2], 0, 0, 0, 0);
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    // console.log(inputDate.getTime(), today.getTime())
    return inputDate.getTime() == today.getTime();
};

function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    return hours + ":" + minutes + ":" + seconds;
}

(function() {
    'use strict';

var today = new Date();

    function calcul() {
        var tempstreballat = 0
        var inicibloc = "";
        var fibloc = "";
        var tancat = false;
        $.each(entrades, function(index, value) {
            // console.log( index + ": " + value);
            // console.log(value );
            if (inicibloc == "" && value[1].indexOf("Entrada") >= 0) {
                inicibloc = (new Date(value[0])).getTime();
                tancat = false;
            }
            if (inicibloc != "" && fibloc == "" && value[1].indexOf("Entrada") == -1) {                
		tempstreballat = tempstreballat + ((new Date(value[0])).getTime() - inicibloc);
                inicibloc = "";
                fibloc = "";
                tancat = true;
            }
        });
        if (!tancat && inicibloc != "") {
            var ara = new Date();
            tempstreballat = tempstreballat + (ara.getTime() - inicibloc)
        }
        // console.log(tancat)
        // console.log(msToTime(tempstreballat));
        $("#hores").html("<h1  style=\"font-size:46px\">" + msToTime(tempstreballat) + "</h1>");
        var horestreballades = tempstreballat / (1000 * 60 * 60)
        if (horestreballades >= 8) {
            $("#hores").css("color", "red")
        } else if (horestreballades >= 7 || (today.getDay()==5 && horestreballades >= 5) ) {
            $("#hores").css("color", "orange")
        }
    }

    var scope = $('#filtres > form:nth-child(1) > select').val();
    if (scope != "todos") {

        /*miro si veuen a tothom*/
        var cella_entrades = 1;
        var cella2 = $("#infoMarcatges > table > thead > tr > th:nth-child(2)").html();
        if (cella2 == "NOM") {
            cella_entrades = 2;
        }
        var entrades = [];
        $("#infoMarcatges > table  tbody  tr").each(function() {
            var temps = $(this).find("td").first().html();
            if (isPastDate(temps)) {
                // console.log(temps);
                if (cella_entrades == 2) {
                    entrades.push([temps, $(this).find("td").first().next().next().html()]);
                } else {
                    entrades.push([temps, $(this).find("td").first().next().html()]);
                }
            }
        });
        $("#info").prepend("<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css\"><div class=\"column\" id='hores'></div><i class=\"fa fa-info-circle\" style=\"font-size:36px\"></i><div class=\"column\" id='nips' style=\"overflow-x:hidden; display:none\"></div>");
        entrades = entrades.reverse();

        setInterval(function() {
            calcul();
        }, 1000);

        // info
        $('#nips').append(" <script>  $(\".fa-info-circle\").click(function(){  $(\"#nips\").toggle();});</script> \
                            <div style=\"width:100%;display: block;\" > \
	<p><b>Del gener a mitjans de juny</b>, partida de dilluns a dijous i contínua el divendres per a un total  de  38  h/s.</p>  <ul style=\"width:100%;display: block;\">   \
	<li>De dilluns a dijous: 8 hores diaries</li> <li>Divendres: 6 hores</li>  \
	<li>Aturada mínima per dinar de 30 minuts</li>  \
	</ul></div><div style=\"width:100%;display: block;\"><p><b>De  mitjans  de  juny  a  mitjans  de  setembre</b>  i  <b>de  Nadal  a  Reis</b></p>  \
	<ul style=\"width:100%;display: block;\"><li>Jornada contínua  de  dilluns  a divendres, de 8.00 a 15.00 hores (35 h/s).</li>  \
	<li>Aturada per esmorzar de 15 minuts</li>  </ul>     \
	<p><b>De mitjans de setembre al desembre</b>, partida de dilluns a dijous i contínua el divendres per a un total de 37,5 h/s.</p><ul><li>De dilluns a dijous: 8 hores diaries</li> <li>Divendres: 5:30 hores</li>  \
	<li>Aturada mínima per dinar de 30 minuts</li>  </ul> <p>*Extensió completament extraoficial, les dades mostrades poden no ser les correctes, el desenvolupador no es fa responsable del seu ús.</p>  <div> ");
	    
    }

})();
