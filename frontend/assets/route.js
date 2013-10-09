function getParameters() {
  var url = new String(location.href);

  if (url.indexOf('?') > -1) {
    var queryString = url.split('?');
    if (queryString[1].length > 0) {
      var paramString = queryString[1];
      var params = paramString.split("&");
      for (var i=0; i<= params.length-1; i++){
        if (debug) GLog.write("params["+i+"]="+	params[i]);
        var curParam= params[i].split("=");
        if (debug) GLog.write("["+i+"]curParam[0]="+curParam[0]+", curParam[1]="+curParam[1]);
        if (curParam[1] && (curParam[1].length > 0)) {
	  var param=curParam[0].toLowerCase();
          if (debug) {GLog.write(param+'='+curParam[1]);}
          switch (param) {
            case "latattr":
              latitudeAttr = curParam[1];
              break;
            case "lngattr":
              longitudeAttr = curParam[1];
              break;
            case "addr1":
              document.getElementById("search1").value = unescape(curParam[1]);
              break;
            case "addr2":
              document.getElementById("search2").value = unescape(curParam[1]);
              break;
            case "lon":
              var curlon = curParam[1];
	      if ((curlon >=-180 ) && (curlon <= 180)) {
                mapInitLongitude = curlon;
	      }
              break;
            case "lat":
              var curlat = curParam[1];
	      if ((curlat >=-180 ) && (curlat <= 180)) {
                mapInitLatitude = curlat;
	      }
              break;
            case "zoom":
              var curzoom = parseInt(curParam[1]);
	      if ((curzoom >=0 ) && (curzoom <= 22)) {
	        mapInitZoom = curzoom;
	      }
              break;
            case "xml":
              var curfile = curParam[1];
	      mapInitFile = curfile;
              break;
            case "tab":
              var curtab = parseInt(curParam[1]);
              mapInitTab = curtab;
              break;
            case "marker":
              var curmarker = parseInt(curParam[1]);
              mapInitMarker = curmarker;
              break;
            case "traveltype":
              var travelTypeElement = document.getElementById("travel-mode-input");
              // var value = travelTypeElement.options[travelTypeElement.selectedIndex].value;

              var travelType = curParam[1].toUpperCase();
	      for (i=0; i<travelTypeElement.options.length; i++) 
              {
                var value = travelTypeElement.options[i].value;
	        if (value.toUpperCase() == travelType)
                {
                  travelTypeElement.selectedIndex = i;
                  break;
                }
              }
	      break;
  
            case "type":
              if ( curParam[1].toLowerCase() == 'sat' ) {
                mapInitType = "sat";
              } else if ( curParam[1].toLowerCase() == 'hybrid' ) {
                mapInitType = "hybrid";
              } else if ( curParam[1].toLowerCase() == 'terrain' ) {
                mapInitType = "terrain";
              } else {
                mapInitType = "map";
              }
              break;
          }
	}
      }
    }
  }
}

var rendererOptions = {
  draggable: true,
  suppressInfoWindows: false
};
var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);;
var directionsService = new google.maps.DirectionsService();
var gmarkers = [];
var map = null;
var stepMarkers = [];
var startLocation = null;
var endLocation = null;
var directionsResponse = null;
var debug = false;
var polyline = new google.maps.Polyline({
	path: [],
	strokeColor: '#FF0000',
	strokeWeight: 3
});
var cambridge = new google.maps.LatLng(52.211150, 0.091955);
var polylineEncoder = new PolylineEncoder();

var icons = new Array();
icons["red"] = new google.maps.MarkerImage("mapIcons/marker_red.png",
      // This marker is 20 pixels wide by 34 pixels tall.
      new google.maps.Size(20, 34),
      // The origin for this image is 0,0.
      new google.maps.Point(0,0),
      // The anchor for this image is at 9,34.
      new google.maps.Point(9, 34));
function getMarkerImage(iconColor) {
   if ((typeof(iconColor)=="undefined") || (iconColor==null)) { 
      iconColor = "red"; 
   }
   if (!icons[iconColor]) {
      icons[iconColor] = new google.maps.MarkerImage("mapIcons/marker_"+ iconColor +".png",
      // This marker is 20 pixels wide by 34 pixels tall.
      new google.maps.Size(20, 34),
      // The origin for this image is 0,0.
      new google.maps.Point(0,0),
      // The anchor for this image is at 6,20.
      new google.maps.Point(9, 34));
   } 
   return icons[iconColor];

}

  // Marker sizes are expressed as a Size of X,Y
  // where the origin of the image (0,0) is located
  // in the top left of the image.
 
  // Origins, anchor positions and coordinates of the marker
  // increase in the X direction to the right and in
  // the Y direction down.

  var iconImage = new google.maps.MarkerImage('mapIcons/marker_red.png',
      // This marker is 20 pixels wide by 34 pixels tall.
      new google.maps.Size(20, 34),
      // The origin for this image is 0,0.
      new google.maps.Point(0,0),
      // The anchor for this image is at 9,34.
      new google.maps.Point(9, 34));
  var iconShadow = new google.maps.MarkerImage('http://www.google.com/mapfiles/shadow50.png',
      // The shadow image is larger in the horizontal dimension
      // while the position and offset are the same as for the main image.
      new google.maps.Size(37, 34),
      new google.maps.Point(0,0),
      new google.maps.Point(9, 34));
      // Shapes define the clickable region of the icon.
      // The type defines an HTML &lt;area&gt; element 'poly' which
      // traces out a polygon as a series of X,Y points. The final
      // coordinate closes the poly by connecting to the first
      // coordinate.
  var iconShape = {
      coord: [9,0,6,1,4,2,2,4,0,8,0,12,1,14,2,16,5,19,7,23,8,26,9,30,9,34,11,34,11,30,12,26,13,24,14,21,16,18,18,16,20,12,20,8,18,4,16,2,15,1,13,0],
      type: 'poly'
  };
var infowindow = new google.maps.InfoWindow(
  { 
    size: new google.maps.Size(150,50)
  });
    
function createMarker(latlng, label, html, color) {
// alert("createMarker("+latlng+","+label+","+html+","+color+")");
    var contentString = '<b>'+label+'<\/b><br>'+html;
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        shadow: iconShadow,
        icon: getMarkerImage(color),
        shape: iconShape,
        title: label,
        zIndex: Math.round(latlng.lat()*-100000)<<5
        });
        marker.myname = label;
        gmarkers.push(marker);

    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(contentString); 
        infowindow.open(map,marker);
        });
				
        return marker;
}
 
function getPolylineXml() {
  directionsResponse = directionsDisplay.getDirections();
  if (!directionsResponse) { alert("no route"); return; }

  polyline = addStepMarkers(directionsResponse);
  // alert("[0]polyline contains "+polyline.getPath().getLength()+" points");
  document.getElementById("polyline").value="<?xml version='1.0' encoding='UTF-8'?>\n<markers>\n";
  if (document.getElementById("markers").checked) {
     if (startLocation && startLocation.latlng && startLocation.address) {
       document.getElementById("polyline").value+="<marker lat='"+startLocation.latlng.lat().toFixed(6)+"' lng='"+startLocation.latlng.lng().toFixed(6)+"' label='Start' html='&lt;b&gt;Start&lt;/b&gt;&lt;br&gt;address: "+startLocation.address+"&lt;br&gt;coordinates: ("+startLocation.latlng.toUrlValue(6)+")' icon='green' />\n";
     }
     if (endLocation && endLocation.latlng && endLocation.address) {
       document.getElementById("polyline").value+="<marker lat='"+endLocation.latlng.lat().toFixed(6)+"' lng='"+endLocation.latlng.lng().toFixed(6)+"' label='End' html='&lt;b&gt;End&lt;/b&gt;&lt;br&gt;address: "+endLocation.address+"&lt;br&gt;coordinates: ("+endLocation.latlng.toUrlValue(6)+")' icon='red' />\n";
     }
  }
  if (document.getElementById("steps").checked) {
    for (var i=0;i<stepMarkers.length;i++) {
      var stepMarkerText ="<marker lat='"+stepMarkers[i].getPosition().lat().toFixed(6)+"' lng='"+stepMarkers[i].getPosition().lng().toFixed(6)+"' label='Step "+i+"' icon='blue' >";
      stepMarkerText += "<![CDATA[";
      stepMarkerText += stepMarkers[i].step_instructions+"]]>\n";
      stepMarkerText += "<\/marker>\n";
      document.getElementById("polyline").value+=stepMarkerText;
    }
  } 

  if (!document.getElementById("encoded").checked) {

    document.getElementById("polyline").value+="<line colour='#FF0000' width='4' html='Directions Polyline'>\n";
// alert("processing polyline "+polyline.getPath().getLength()+" vertices");
    for (var i=0; i< polyline.getPath().getLength(); i++) {
      var point = polyline.getPath().getAt(i);
      document.getElementById("polyline").value+="<point lat='"+point.lat().toFixed(6)+"' lng='"+point.lng().toFixed(6)+"' />\n";
    }
    document.getElementById("polyline").value+="<\/line>\n<\/markers>"                 
  } else { // encoded polyline
    var points = [];
    for (var i=0; i< polyline.getPath().getLength(); i++) {
      points[i] = polyline.getPath().getAt(i);
    }
    var encodedPoly = polylineEncoder.dpEncodeToJSON(points,"#FF0000",4,0.8);
    document.getElementById('polyline').value += "<encodedline colour='#FF0000' width='4' numLevels='"+encodedPoly.numLevels+"' zoomFactor='"+encodedPoly.zoomFactor+"' html='Directions Polyline' >\n";
    document.getElementById('polyline').value += "<points><![CDATA["+encodedPoly.points+"]]><\/points>\n";
    document.getElementById('polyline').value += "<levels><![CDATA["+encodedPoly.levels+"]]><\/levels>\n";
    document.getElementById('polyline').value += "<\/encodedline>\n";
  } 
  document.getElementById("polyline").value += "<\/markers>";                 
} 

function addStepMarkers(result) {
  polyline = new google.maps.Polyline({
  	path: [],
  	strokeColor: '#FF0000',
  	strokeWeight: 3
  });
  infowindow.close();
  for (var i=gmarkers.length-1;i>=0;i--) {
    gmarkers[i].setMap(null);
    gmarkers.pop();
  }
  if (startLocation && startLocation.marker) startLocation.marker.setMap(null);
  if (endLocation && endLocation.marker) endLocation.marker.setMap(null);
  var startLocation = new Object();
  var endLocation = new Object();
  var bounds = new google.maps.LatLngBounds();
  for (var i=0;i<stepMarkers.length;i++) {
    stepMarkers[i].setMap(null);
  }
  stepMarkers = [];
  for (var h = 0; h < result.routes.length; h++) {
    var route = result.routes[h];
    // alert("processing "+route.legs.length+" legs");
    // For each route, display summary information.
    var legs = route.legs;
         for (i=0;i<legs.length;i++) {
           if (i == 0) { 
             startLocation.latlng = legs[i].start_location;
             startLocation.address = legs[i].start_address;
             startLocation.marker = createMarker(legs[i].start_location,"start",legs[i].start_address,"green");
           } else { 
             waypts[i] = new Object();
             waypts[i].latlng = legs[i].start_location;
             waypts[i].address = legs[i].start_address;
             waypts[i].marker = createMarker(legs[i].start_location,"waypoint"+i,legs[i].start_address,"yellow");
           }
           endLocation.latlng = legs[i].end_location;
           endLocation.address = legs[i].end_address;
           var steps = legs[i].steps;
           // alert("processing "+steps.length+" steps");
           for (j=0;j<steps.length;j++) {
             var nextSegment = steps[j].path;
             var stepText = "";
             if (j>0) stepText = "<a href='javascript:google.maps.event.trigger(stepMarkers["+(j-1)+"], \"click\")'>Prev<\/a>"
             if (j<(steps.length-1)) {
               if (stepText != "") { stepText += " - "; }
               stepText += "<a href='javascript:google.maps.event.trigger(stepMarkers["+(j+1)+"], \"click\")'>Next<\/a>"
             }
             stepText = steps[j].instructions+"<br>"+stepText;
             stepMarkers.push(createMarker(steps[j].start_location,"step",stepText,"blue"));
             stepMarkers[stepMarkers.length-1].step_instructions = steps[j].instructions;
             // alert("processing "+nextSegment.length+" points");
             for (k=0;k<nextSegment.length;k++) {
               polyline.getPath().push(nextSegment[k]);
               bounds.extend(nextSegment[k]);
             }
           }
     }
   }
   // alert("[1]polyline contains "+polyline.getPath().getLength()+" points");
   return polyline;
}

 function getSelectedTravelMode() {
    var value = $(".travel-mode").val();
    value = value.toUpperCase();
    if (value == 'DRIVING') {
      value = google.maps.DirectionsTravelMode.DRIVING;
    } else if (value == 'BICYCLING') {
      value = google.maps.DirectionsTravelMode.BICYCLING;
    } else if (value == 'WALKING') {
      value = google.maps.DirectionsTravelMode.WALKING;
    } else if (value == 'TRANSIT') {
      value = google.maps.DirectionsTravelMode.TRANSIT;
    } else {
      alert('Unsupported travel mode.');
      value = google.maps.DirectionsTravelMode.DRIVING;
    }
    return value;
  }


function calcRoute() {
    var start = $('.start').val();
    var end =  $('.end').val();
    var provideAlternates = false;
    var request = {
      origin: start,
      destination: end,
      travelMode: getSelectedTravelMode(),
      provideRouteAlternatives: provideAlternates
    };
    directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsResponse = response;
        directionsDisplay.setDirections(response);
        // alert("[2]polyline contains "+polyline.getPath().getLength()+" points");
        polyline = addStepMarkers(response);
        // alert("[3]polyline contains "+polyline.getPath().getLength()+" points");
     }
    });
  }

function initialize() {
	var myOptions = {
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      center: cambridge
    };
    map = new google.maps.Map($(".map-canvas")[0], myOptions);
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel($(".directions-panel")[0]);
 
    google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
      computeTotalDistance(directionsDisplay.directions);
      addStepMarkers(directionsDisplay.directions);
    });
    //getParameters();
    calcRoute();
}

function getPolylineXml() {
  directionsResponse = directionsDisplay.getDirections();
  if (!directionsResponse) { alert("no route"); return; }

  polyline = addStepMarkers(directionsResponse);
  // alert("[0]polyline contains "+polyline.getPath().getLength()+" points");
  document.getElementById("polyline").value="<?xml version='1.0' encoding='UTF-8'?>\n<markers>\n";
  if (document.getElementById("markers").checked) {
     if (startLocation && startLocation.latlng && startLocation.address) {
       document.getElementById("polyline").value+="<marker lat='"+startLocation.latlng.lat().toFixed(6)+"' lng='"+startLocation.latlng.lng().toFixed(6)+"' label='Start' html='&lt;b&gt;Start&lt;/b&gt;&lt;br&gt;address: "+startLocation.address+"&lt;br&gt;coordinates: ("+startLocation.latlng.toUrlValue(6)+")' icon='green' />\n";
     }
     if (endLocation && endLocation.latlng && endLocation.address) {
       document.getElementById("polyline").value+="<marker lat='"+endLocation.latlng.lat().toFixed(6)+"' lng='"+endLocation.latlng.lng().toFixed(6)+"' label='End' html='&lt;b&gt;End&lt;/b&gt;&lt;br&gt;address: "+endLocation.address+"&lt;br&gt;coordinates: ("+endLocation.latlng.toUrlValue(6)+")' icon='red' />\n";
     }
  }
  if (document.getElementById("steps").checked) {
    for (var i=0;i<stepMarkers.length;i++) {
      var stepMarkerText ="<marker lat='"+stepMarkers[i].getPosition().lat().toFixed(6)+"' lng='"+stepMarkers[i].getPosition().lng().toFixed(6)+"' label='Step "+i+"' icon='blue' >";
      stepMarkerText += "<![CDATA[";
      stepMarkerText += stepMarkers[i].step_instructions+"]]>\n";
      stepMarkerText += "<\/marker>\n";
      document.getElementById("polyline").value+=stepMarkerText;
    }
  } 

  if (!document.getElementById("encoded").checked) {

    document.getElementById("polyline").value+="<line colour='#FF0000' width='4' html='Directions Polyline'>\n";
// alert("processing polyline "+polyline.getPath().getLength()+" vertices");
    for (var i=0; i< polyline.getPath().getLength(); i++) {
      var point = polyline.getPath().getAt(i);
      document.getElementById("polyline").value+="<point lat='"+point.lat().toFixed(6)+"' lng='"+point.lng().toFixed(6)+"' />\n";
    }
    document.getElementById("polyline").value+="<\/line>\n<\/markers>"                 
  } else { // encoded polyline
    var points = [];
    for (var i=0; i< polyline.getPath().getLength(); i++) {
      points[i] = polyline.getPath().getAt(i);
    }
    var encodedPoly = polylineEncoder.dpEncodeToJSON(points,"#FF0000",4,0.8);
    document.getElementById('polyline').value += "<encodedline colour='#FF0000' width='4' numLevels='"+encodedPoly.numLevels+"' zoomFactor='"+encodedPoly.zoomFactor+"' html='Directions Polyline' >\n";
    document.getElementById('polyline').value += "<points><![CDATA["+encodedPoly.points+"]]><\/points>\n";
    document.getElementById('polyline').value += "<levels><![CDATA["+encodedPoly.levels+"]]><\/levels>\n";
    document.getElementById('polyline').value += "<\/encodedline>\n";
  } 
  document.getElementById("polyline").value += "<\/markers>";                 
}

function getIssues() {
  $('body').css('opacity',0.1);
  directionsResponse = directionsDisplay.getDirections();
  if (!directionsResponse) { alert("no route"); return; }

  var tmp = directionsResponse.routes[0]['overview_path'];
  var length = tmp.length;
  var points = [];
  for(var i = 0; i < length; i++) {
    var point = [tmp[i]['lb'], tmp[i]['mb']]
    points.push(point)
  }
  var data = JSON.stringify(points);
  console.log(data);
  var success = function(data){
    $('body').css('opacity',1);
    data = jQuery.parseJSON(data);
    console.log(data);
    var limit = data.length;
    var openWindow = function(infoWindow) {
      return function() {
        infowindow.open(map,marker);
      }
    }
    for(var i = 0; i < limit; i++) {
      // add marker
      var issue = data[i];
      console.log(issue['latlong'])
      var coords = issue['latlong'].replace('POINT(', '').replace(')', '').split(' ');
      console.log(coords);
      if(coords.length > 2) {
        continue;
      }
      var contentString = '<div id="content">'+
      '<div id="siteNotice">'+
      '</div>'+
      '<h1 id="firstHeading" class="firstHeading">Uluru</h1>'+
      '<div id="bodyContent">'+
      '<p><b>Uluru</b>, also referred to as <b>Ayers Rock</b>, is a large ' +
      'sandstone rock formation in the southern part of the '+
      'Northern Territory, central Australia. It lies 335&#160;km (208&#160;mi) '+
      'south west of the nearest large town, Alice Springs; 450&#160;km '+
      '(280&#160;mi) by road. Kata Tjuta and Uluru are the two major '+
      'features of the Uluru - Kata Tjuta National Park. Uluru is '+
      'sacred to the Pitjantjatjara and Yankunytjatjara, the '+
      'Aboriginal people of the area. It has many springs, waterholes, '+
      'rock caves and ancient paintings. Uluru is listed as a World '+
      'Heritage Site.</p>'+
      '<p>Attribution: Uluru, <a href="http://en.wikipedia.org/w/index.php?title=Uluru&oldid=297882194">'+
      'http://en.wikipedia.org/w/index.php?title=Uluru</a> '+
      '(last visited June 22, 2009).</p>'+
      '</div>'+
      '</div>';

      var infowindow = new google.maps.InfoWindow({
          content: contentString
      });
      var myLatlng = new google.maps.LatLng(coords[1], coords[0]);
      var marker = new google.maps.Marker({
          position: myLatlng,
          map: map,
          title: issue['descrip']
      });
      google.maps.event.addListener(marker, 'click', openWindow(marker));
    }
  };
  $.ajax('/locationAPI',{
    'data': data, 
    'type': 'POST',
    'processData': false,
    'contentType': 'application/json',
    'success': success
  });
}


$(document).ready(function(){
	$('.calculate').click(calcRoute);
  $('.get-issues').click(getIssues);
})


google.maps.event.addDomListener(window, 'load', initialize);