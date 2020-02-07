// ==UserScript==
// @name         Fitxatge
// @namespace    http://tampermonkey.net/
// @version      0.45
// @description  Plugin no oficial eina fitxatge
// @author       You
// @match        https://fitxatge.csuc.cat/marcajes.php
// @grant        none
// @updateURL   https://raw.githubusercontent.com/kerojohan/tamperfitxatge/master/fitxatge.js
// @downloadURL https://raw.githubusercontent.com/kerojohan/tamperfitxatge/master/fitxatge.js
// ==/UserScript==
function isTodayEntry(dateText) {
    var inputDate = dateText.split(" ");
    inputDate = inputDate[0].split("-");
    var today = new Date();
    inputDate = new Date(inputDate[0], inputDate[1] - 1, inputDate[2], 0, 0, 0, 0);
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    // console.log(inputDate.getTime(), today.getTime())
    return inputDate.getTime() == today.getTime();
};

function msToTime(milliseconds,format) {
    //Get hours from milliseconds
    var hours = milliseconds / (1000 * 60 * 60);
    var absoluteHours = Math.floor(hours);
    var h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours;

    //Get remainder from hours and convert to minutes
    var minutes = (hours - absoluteHours) * 60;
    var absoluteMinutes = Math.floor(minutes);
    var m = absoluteMinutes > 9 ? absoluteMinutes : '0' + absoluteMinutes;

    //Get remainder from minutes and convert to seconds
    var seconds = (minutes - absoluteMinutes) * 60;
    var absoluteSeconds = Math.floor(seconds);
    var s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds;
    var result ="";
    if(format==1) {
        result = h + ':' + m + ':' + s ;
    }else{
        result = h + ':' + m
    }
    return result;
}

function calcul(entrades) {
    var tempstreballat = 0
    var inicibloc = "";
    var fibloc = "";
    var tancat = false;
    var lastValue;
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
        lastValue=value[0];
    });
    if (!tancat && inicibloc != "" && isTodayEntry(lastValue)) {
        var ara = new Date();
        tempstreballat = tempstreballat + (ara.getTime() - inicibloc)
    }
    // console.log(tancat)
    return tempstreballat;
}


function print(horesdia, horesmensuals) {
    // console.log(horesdia,horesmensuals);
    var today = new Date();
    $("#hh").html(msToTime(horesdia,1));

    $("#mh").html(msToTime(horesmensuals,2));

    var horestreballades = horesdia / (1000 * 60 * 60)
    if (horestreballades >= 8) {
        $("#hh").css("color", "red")
    } else if (horestreballades >= 7 || (today.getDay() == 5 && horestreballades >= 5)) {
        $("#hh").css("color", "orange")
    }
}

(function() {
    'use strict';

    var today = new Date();
    var scope = $('#filtres > form:nth-child(1) > select').val();
    if (scope != "todos") {

        /*miro si veuen a tothom*/
        var cella_entrades = 1;
        var cella2 = $("#infoMarcatges > table > thead > tr > th:nth-child(2)").html();
        if (cella2 == "NOM") {
            cella_entrades = 2;
        }
        var entrades = [];
        var entrades_mensuals = []; //on van tots els dies menys l'actual
        $("#infoMarcatges > table  tbody  tr").each(function() {
            var temps = $(this).find("td").first().html();
            // console.log(temps);
            if (cella_entrades == 2) {
                if (isTodayEntry(temps)) {
                    entrades.push([temps, $(this).find("td").first().next().next().html()]);
                } else {
                    entrades_mensuals.push([temps, $(this).find("td").first().next().next().html()]);
                }
            } else {
                if (isTodayEntry(temps)) {
                    entrades.push([temps, $(this).find("td").first().next().html()]);
                } else {
                    entrades_mensuals.push([temps, $(this).find("td").first().next().html()]);
                }
            }
        });


        /*si hi han entrades del dia actual posar rellotge*/
        if (entrades.length > 0 || entrades_mensuals.length >0) {
            $("#info").prepend("<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css\"><div class=\"plusinfo column\"></div><i class=\"fa fa-info-circle\" style=\"font-size:36px\"></i><div class=\"column\" id='nips' style=\"overflow-x:hidden; display:none\"></div>");
            if (entrades.length > 0){
                $(".plusinfo").append("<div id='hores'><h1  id=\"hh\" style=\"font-size:46px\"></h1></div>");
                entrades = entrades.reverse();
            }
            if(entrades_mensuals.length >0){
		var user=$('#filtres > form > select[name="usuarioSeleccionado"] option:selected').text();    
                var strmes=$('#filtres > form > select[name="mesSeleccionat"] option:selected').text();
                $(".plusinfo").append("<div id='horesmensuals'><h2  style=\"font-size:24px;display: flex;\"><span>("+user+" - "+strmes+":&nbsp;</span><span id=\"mh\"></span><span>h)</span></h2></div>");
                entrades_mensuals = entrades_mensuals.reverse();
            }
            var hmensual = calcul(entrades_mensuals);
            setInterval(function() {
                var hores_dia_actual = calcul(entrades);
                print(hores_dia_actual, hmensual + hores_dia_actual);
            }, 1000);
        }
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
