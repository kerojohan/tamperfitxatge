// ==UserScript==
// @name         Fitxatge
// @namespace    http://tampermonkey.net/
// @version      0.465
// @description  Plugin no oficial eina fitxatge
// @author       You
// @match        https://fitxatge.csuc.cat/marcajes.php
// @grant        none
// @updateURL   https://raw.githubusercontent.com/kerojohan/tamperfitxatge/master/fitxatge.js
// @downloadURL https://raw.githubusercontent.com/kerojohan/tamperfitxatge/master/fitxatge.js
// ==/UserScript==

function getWeekNumber(d) {
    // Copy date so don't modify original
    d=new Date(d);
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    // Return array of year and week number
    return weekNo;
}

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
        // console.log(value.hora_marcatge );
        if (inicibloc == "" && value.tipus.indexOf("Entrada") >= 0) {
            inicibloc = (new Date(value.hora_marcatge)).getTime();
            tancat = false;
        }
        if (inicibloc != "" && fibloc == "" && value.tipus.indexOf("Entrada") == -1) {
            tempstreballat = tempstreballat + ((new Date(value.hora_marcatge)).getTime() - inicibloc);
            inicibloc = "";
            fibloc = "";
            tancat = true;
        }
        lastValue=value.hora_marcatge;
    });
    if (!tancat && inicibloc != "" && isTodayEntry(lastValue)) {
        var ara = new Date();
        tempstreballat = tempstreballat + (ara.getTime() - inicibloc)
    }
    // console.log(tancat)
    return tempstreballat;
}


function print(horesdia, horesmensuals,horessetmana) {
    // console.log(horesdia,horesmensuals);
    var today = new Date();
    $("#horesdiaactual").html(msToTime(horesdia,1));

    $("#horesmes").html(msToTime(horesmensuals,2)+"h");
    $("#actualweekofYear").html(msToTime(horessetmana,2)+"h");

    var horestreballades = horesdia / (1000 * 60 * 60)
    if (horestreballades >= 8) {
        $("#horesdiaactual").css("color", "red")
    } else if (horestreballades >= 7 || (today.getDay() == 5 && horestreballades >= 5)) {
        $("#horesmes").css("color", "orange")
    }
}

(function() {
    'use strict';
    var myObj = {}
    myObj.today = new Date();
    var scope = $('#filtres > form:nth-child(1) > select').val();
    if (scope != "todos") {

        /*miro si veuen a tothom*/
        var cella_tipus_entrades = 1;
        var cella2 = $("#infoMarcatges > table > thead > tr > th:nth-child(2)").html();
        if (cella2 == "NOM") {
            cella_tipus_entrades = 2;
        }

        myObj.entrades_avui = [];
        myObj.entrades_mensuals = []; //on van tots els dies menys l'actual
        $("#infoMarcatges > table  tbody  tr").each(function() {
            var temps = $(this).find("td").first().html();
            var weekinyear = getWeekNumber(temps);
            // console.log(temps);
            if (isTodayEntry(temps)) {
                myObj.entrades_avui.push({"hora_marcatge":temps, "tipus":$(this).find("td:eq( "+cella_tipus_entrades+" )").html(),"setmanaAny":weekinyear});
            } else {
                myObj.entrades_mensuals.push({"hora_marcatge":temps, "tipus":$(this).find("td:eq( "+cella_tipus_entrades+" )").html(),"setmanaAny":weekinyear});
            }
        });

        myObj.actualweekofYear=getWeekNumber(myObj.today);;
        /*si hi han entrades del dia actual posar rellotge*/
        if (myObj.entrades_avui.length > 0 || myObj.entrades_mensuals.length >0) {
            $("#info").prepend("<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css\">\
<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/gh/kerojohan/tamperfitxatge@master/fitxatge2.css\">\
<div class=\"plusinfo column\"></div><i class=\"fa fa-info-circle\" style=\"font-size:36px\" title=\"Clica per més informació\"></i><div class=\"column\" id='nips' style=\"overflow-x:hidden; display:none\"></div><div id=\"taulasetmanal\"/>");
            if (myObj.entrades_avui.length > 0){
                $(".plusinfo").append("<div><h1  id=\"horesdiaactual\" style=\"font-size:46px\"></h1></div>");
                myObj.entrades_avui = myObj.entrades_avui.reverse();
            }
            if(myObj.entrades_mensuals.length >0){
                var user=$('#filtres > form > select[name="usuarioSeleccionado"] option:selected').text();
                if(user!=""){ user= user+" - "}
                var strmes=$('#filtres > form > select[name="mesSeleccionat"] option:selected').text();
                $(".plusinfo").append("<div id='horesmensuals'><h2  style=\"font-size:24px;display: flex;\"><span>("+user+strmes+":&nbsp;</span><span id=\"horesmes\"></span><span>)</span></h2></div>");
                myObj.entrades_mensuals = myObj.entrades_mensuals.reverse();
            }
            var taulasetmanal="";
            var totes_les_entrades=(myObj.entrades_mensuals).concat(myObj.entrades_avui);
            //console.log($.unique(totes_les_entrades.map(function (d) {return d.setmanaAny;})));


            $.each($.unique(totes_les_entrades.map(function (d) {return d.setmanaAny;})), function(i, value)
                   {
                var entrades_setmanes;
                var suma=0;
                var idactual="";
                //la setmana actual es tracte com suma de totes les altres entrades (estàtic) + suma d'entrades del dia (dinàmic)
                if(myObj.actualweekofYear==value){
                    entrades_setmanes=totes_les_entrades.filter(function (el) {return (el.setmanaAny==value && (new Date(el.hora_marcatge)).getDay()!=myObj.today.getDay());});
                    myObj.setmanaencurs=entrades_setmanes;
                    idactual="id=\"actualweekofYear\"";
                    //console.log(entrades_setmanes)
                    suma=calcul(entrades_setmanes)+calcul(myObj.entrades_avui);
                }
                else{
                    entrades_setmanes=totes_les_entrades.filter(function (el) {return el.setmanaAny==value;});
                    //console.log(entrades_setmanes)
                    suma=calcul(entrades_setmanes);
                }
                taulasetmanal=taulasetmanal+"<tr><td>"+value+"</td><td "+idactual+">"+msToTime(suma)+"h</td></tr>"
            });

            $("#taulasetmanal").prepend("<table><thead><tr><th>Setmana</th><th>Hores</th></tr></thead><tbody>"+taulasetmanal+"</tbody></table>");

            var hmensual = calcul(myObj.entrades_mensuals);
            var horessetmana = calcul(myObj.setmanaencurs);
            setInterval(function() {
                var hores_dia_actual = calcul(myObj.entrades_avui);
                print(hores_dia_actual, hmensual + hores_dia_actual,horessetmana+ hores_dia_actual);
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
