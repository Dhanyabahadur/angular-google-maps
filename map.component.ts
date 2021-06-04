import { Component, OnInit, Input, ViewChild, NgZone } from '@angular/core';

import { MapsAPILoader, AgmMap } from '@agm/core';

import { GoogleMapsAPIWrapper } from '@agm/core/services';

declare var google:any;

interface Marker{
  lat:number;
  lng:number;
  label?: string;
  draggable: boolean;
}
interface Location{
  lat: number;
  lng: number;
  viewport?: object;
  zoom: number;
  Latitude? : number;
  Longitude? : number;
  marker? : Marker;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  geocoder: any;
  public location:Location = {
    lat: 51.678418,
    lng: 7.809007,
    marker:{
      lat: 51.678418,
      lng: 7.809007,
      draggable: true,
    },
    zoom: 5
  };

  //map: any[] =[];



  @ViewChild(AgmMap) map: AgmMap;

  constructor(public mapsAPILoader: MapsAPILoader,
              private zone: NgZone,
              private wrapper: GoogleMapsAPIWrapper) {
    this.mapsApiLoader = mapsApiLoader;
    this.zone = zone;
    this.wrapper = wrapper;
    this.mapsAPILoader.load().then(() => {
      this.geocoder = new google.maps.Geocoder();
    });
  }

  //ngOnInit(): void {
  //}

  ngOnInit(){
    this.location.marker.draggable = true;// Issue 1
  }
  updateOnMap(){
    let full_address:number = this.location.Latitude // Issue 2
    if(this.location.Longitude) full_address= full_address + this.location.Longitude
    this.findLocation(full_address);
  }
  findLocation(address){ // Issue3
    if(!this.geocoder) this.geocoder = new google.maps.Geocoder()
    this.geocoder.geocode({
      'address':address
    },(results, status) => {
      console.log(results);
      if(status == google.maps.GeocoderStatus.OK){
        for(var i=0; i<results[0].address_components.length; i++){
          let types = results[0].address_components[i].types
          if(types.indexOf('latitude')!= -1){
            this.location.Longitude = results[0].address_components[i]
          }
        }
        if(results[0].geometry.location){
          this.location.lat = results[0].geometry.location.lat();
          this.location.lng = results[0].geometry.location.lng();
          this.location.marker.lat = results[0].geometry.location.lat();// Issue 4
          this.location.marker.lng = results[0].geometry.location.lng();
          this.location.marker.draggable = true;
          this.location.viewport = results[0].geometry.viewport;
        }
        this.map.triggerResize()
      }
      else{
        alert("Sorry, this search produced no results.");
      }
    })
  }
  markerDragEnd(m:any, $event: any){
    this.location.marker.lat = m.coords.lat;
    this.location.marker.lng = m.coords.lng;
    this.findAddressByCoordinates();
  }
  findAddressByCoordinates(){
    this.geocoder.geocode({
      'location' : {
        lat: this.location.marker?.lat,
        lng: this.location.marker.lng
      }
    },(results, status) => {
      this.decomposeAddressComponents(results);
    })
  }

  decomposeAddressComponents(addressArray){// Issue 5
    if(addressArray.length == 0) return false;
    let address = addressArray[0].address_components;

    for(let element of address){
      if(element.length == 0 && !element['types']){
        continue;
      }
      if(element['types'].indexOf('street_number')>-1){
        this.location.address_level_1 = element['long_name'];// issue 6
        continue;
      }
      if(element['types'].indexOf('route')>-1){
        this.location.address_level_1+=','+element['long_name'];
        continue;
      }
      if(element['types'].indexOf('locality')>-1){
        this.location.address_level_2 = element['long_name'];
        continue;
      }
      if(element['types'].indexOf('administrative_area_level_1')>-1){
        this.location.address_state = element['long_name'];
        continue;
      }
      if(element['types'].indexOf('postal_code')>-1){
        this.location.address_zip = element['long_name'];
        continue;
      }
    }
  }

}
