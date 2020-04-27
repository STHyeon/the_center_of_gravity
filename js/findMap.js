// 마커를 담을 배열입니다
var markers = [];

var mapContainer = document.getElementById("map"), // 지도를 표시할 div
    mapOption = {
        center: new kakao.maps.LatLng(37.566826, 126.9786567), // 지도의 중심좌표
        level: 3, // 지도의 확대 레벨
    };

// 지도를 생성합니다
var map = new kakao.maps.Map(mapContainer, mapOption);

// 장소 검색 객체를 생성합니다
var ps = new kakao.maps.services.Places();

// 검색 결과 목록이나 마커를 클릭했을 때 장소명을 표출할 인포윈도우를 생성합니다
var infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });

// 좌표를 담을 배열입니다.
var dataList = [];

// 좌표 최대/최소
var xMax = 0;
var xMin = 999;
var yMax = 0;
var yMin = 999;

// 다각형 좌표들을 담을 배열입니다
var polygonPath = [];

var marker = new kakao.maps.Marker({});

var inputKeyword = $("#keyword");

var normal_text = $(".normal_message");

//엔터입력 확인
inputKeyword.keydown(function (e) {
    if (e.keyCode == 13) {
        searchPlaces();
    }
});

// 키워드 검색을 요청하는 함수입니다
function searchPlaces() {
    var keyword = document.getElementById("keyword").value;

    if (!keyword.replace(/^\s+|\s+$/g, "")) {
        alert("키워드를 입력해주세요!");
        return false;
    }

    normal_text.css("display", "none");
    // 장소검색 객체를 통해 키워드로 장소검색을 요청합니다
    ps.keywordSearch(keyword, placesSearchCB);
}

// 장소검색이 완료됐을 때 호출되는 콜백함수 입니다
function placesSearchCB(data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
        // 정상적으로 검색이 완료됐으면
        // 검색 목록과 마커를 표출합니다
        displayPlaces(data);

        // 페이지 번호를 표출합니다
        displayPagination(pagination);
    } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        alert("검색 결과가 존재하지 않습니다.");
        return;
    } else if (status === kakao.maps.services.Status.ERROR) {
        alert("검색 결과 중 오류가 발생했습니다.");
        return;
    }
}

// 검색 결과 목록과 마커를 표출하는 함수입니다
function displayPlaces(places) {
    var listEl = document.getElementById("placesList"),
        menuEl = document.getElementById("menu_wrap"),
        fragment = document.createDocumentFragment(),
        bounds = new kakao.maps.LatLngBounds(),
        listStr = "";

    // 검색 결과 목록에 추가된 항목들을 제거합니다
    removeAllChildNods(listEl);

    // 지도에 표시되고 있는 마커를 제거합니다
    removeMarker();

    for (var i = 0; i < places.length; i++) {
        // 마커를 생성하고 지도에 표시합니다
        var placePosition = new kakao.maps.LatLng(places[i].y, places[i].x),
            marker = addMarker(placePosition, i),
            itemEl = getListItem(i, places[i]); // 검색 결과 항목 Element를 생성합니다

        // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해
        // LatLngBounds 객체에 좌표를 추가합니다
        bounds.extend(placePosition);

        // 마커와 검색결과 항목에 mouseover 했을때
        // 해당 장소에 인포윈도우에 장소명을 표시합니다
        // mouseout 했을 때는 인포윈도우를 닫습니다
        (function (marker, title) {
            kakao.maps.event.addListener(marker, "mouseover", function () {
                displayInfowindow(marker, title);
            });

            kakao.maps.event.addListener(marker, "mouseout", function () {
                infowindow.close();
            });

            itemEl.onmouseover = function () {
                displayInfowindow(marker, title);
            };

            itemEl.onmouseout = function () {
                infowindow.close();
            };
            itemEl.onclick = function () {
                // var addr = $(".addr").text();
                var addr = $(this).find(".addr").text();
                geoLocation(addr);
            };
        })(marker, places[i].place_name);

        fragment.appendChild(itemEl);
    }

    // 검색결과 항목들을 검색결과 목록 Elemnet에 추가합니다
    listEl.appendChild(fragment);
    menuEl.scrollTop = 0;

    // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다
    map.setBounds(bounds);
}

// 검색결과 항목을 Element로 반환하는 함수입니다
function getListItem(index, places) {
    var el = document.createElement("li"),
        itemStr = '<span class="markerbg marker_' + (index + 1) + '"></span>' + '<div class="info">' + "   <h5>" + places.place_name + "</h5>";

    if (places.road_address_name) {
        itemStr += "    <span>" + places.road_address_name + "</span>" + '   <span class="jibun gray addr">' + places.address_name + "</span>";
    } else {
        itemStr += "    <span class='addr'>" + places.address_name + "</span>";
    }

    itemStr += '  <span class="tel">' + places.phone + "</span>" + "</div>";

    el.innerHTML = itemStr;
    el.className = "item";

    return el;
}

// 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
function addMarker(position, idx, title) {
    var imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png", // 마커 이미지 url, 스프라이트 이미지를 씁니다
        imageSize = new kakao.maps.Size(36, 37), // 마커 이미지의 크기
        imgOptions = {
            spriteSize: new kakao.maps.Size(36, 691), // 스프라이트 이미지의 크기
            spriteOrigin: new kakao.maps.Point(0, idx * 46 + 10), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
            offset: new kakao.maps.Point(13, 37), // 마커 좌표에 일치시킬 이미지 내에서의 좌표
        },
        markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions),
        marker = new kakao.maps.Marker({
            position: position, // 마커의 위치
            image: markerImage,
        });

    marker.setMap(map); // 지도 위에 마커를 표출합니다
    markers.push(marker); // 배열에 생성된 마커를 추가합니다

    return marker;
}

// 지도 위에 표시되고 있는 마커를 모두 제거합니다
function removeMarker() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

// 검색결과 목록 하단에 페이지번호를 표시는 함수입니다
function displayPagination(pagination) {
    var paginationEl = document.getElementById("pagination"),
        fragment = document.createDocumentFragment(),
        i;

    // 기존에 추가된 페이지번호를 삭제합니다
    while (paginationEl.hasChildNodes()) {
        paginationEl.removeChild(paginationEl.lastChild);
    }

    for (i = 1; i <= pagination.last; i++) {
        var el = document.createElement("a");
        el.href = "#";
        el.innerHTML = i;

        if (i === pagination.current) {
            el.className = "on";
        } else {
            el.onclick = (function (i) {
                return function () {
                    pagination.gotoPage(i);
                };
            })(i);
        }

        fragment.appendChild(el);
    }
    paginationEl.appendChild(fragment);
}

// 검색결과 목록 또는 마커를 클릭했을 때 호출되는 함수입니다
// 인포윈도우에 장소명을 표시합니다
function displayInfowindow(marker, title) {
    var content = '<div style="padding:5px;z-index:1;">' + title + "</div>";

    infowindow.setContent(content);
    infowindow.open(map, marker);
}

// 검색결과 목록의 자식 Element를 제거하는 함수입니다
function removeAllChildNods(el) {
    while (el.hasChildNodes()) {
        el.removeChild(el.lastChild);
    }
}

// 좌표 구하는 함수입니다
function geoLocation(addr) {
    var geocoder = new kakao.maps.services.Geocoder();
    var callback = function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
            result.map((data, index) => {
                middleCalculator(data.y, data.x);
            });
        }
    };
    geocoder.addressSearch(addr, callback);
}

// 무게중심 구하는 함수입니다
function middleCalculator(fx1, fy1) {
    dataList = [...dataList, fx1, fy1];

    for (var i = 0; i < dataList.length - i * 1; i++) {
        if (xMax < parseFloat(dataList[2 * i])) {
            xMax = parseFloat(dataList[2 * i]);
        }

        if (xMin > parseFloat(dataList[2 * i])) {
            xMin = parseFloat(dataList[2 * i]);
        }

        if (yMax < parseFloat(dataList[2 * i + 1])) {
            yMax = parseFloat(dataList[2 * i + 1]);
        }

        if (yMin > parseFloat(dataList[2 * i + 1])) {
            yMin = parseFloat(dataList[2 * i + 1]);
        }

        //선표시
        // linePath = [...linePath, new kakao.maps.LatLng(dataList[2 * i], dataList[2 * i + 1])];
        // positions = [
        //     {
        //         ...positions,
        //         latlng: new kakao.maps.LatLng(dataList[2 * i], dataList[2 * i + 1]),
        //     },
        // ];
    }

    // 무게중심 구하기
    if (dataList.length < 5) {
        // 직선 무게중심
        console.log("line");
        var cxWeight = (xMin + xMax) / 2;
        var cyWeight = (yMin + yMax) / 2;
    } else if (dataList.length < 7) {
        // 삼각형 무게중심
        console.log("triangle");
        var cxWeight = (parseFloat(dataList[0]) + parseFloat(dataList[2]) + parseFloat(dataList[4])) / 3;
        var cyWeight = (parseFloat(dataList[1]) + parseFloat(dataList[3]) + parseFloat(dataList[5])) / 3;
    } else {
        // 다각형 무게 중심
        console.log("polygon");
        var cxWeight = xMin + (xMax - xMin) / 2;
        var cyWeight = yMin + (yMax - yMin) / 2;
    }

    polyGon(fx1, fy1);
    makeMarker(cxWeight, cyWeight);
}

// 영역표시하는 함수입니다
function polyGon(coorx, coory) {
    var ractangle2 = new kakao.maps.LatLng(coorx, coory);

    polygonPath = [...polygonPath, ractangle2];

    var polygon = new kakao.maps.Polygon({
        path: polygonPath,
        strokeWeight: 3,
        strokeColor: "#39DE2A",
        strokeOpacity: 0.8,
        strokeStyle: "longdash",
        fillColor: "#A2FF99",
        fillOpacity: 0.7,
    });

    polygon.setMap(map);
}

// 마커찍는 함수입니다
function makeMarker(cxWeight, cyWeight) {
    var markerPosition = new kakao.maps.LatLng(cxWeight, cyWeight);
    marker.setMap(null);
    marker = new kakao.maps.Marker({
        position: markerPosition,
    });
    marker.setMap(map);
}
