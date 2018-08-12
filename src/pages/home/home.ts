import {
	GoogleMaps,
	GoogleMapsEvent,
	GoogleMapOptions,
	HtmlInfoWindow,
	LatLngBounds,
	Marker,
	Spherical
  } from '@ionic-native/google-maps';
import { Component } from '@angular/core';
import { ModalController, ToastController, Platform } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { LearnMore } from '../learn/learn';
import { FilterSearch } from '../filter/filter';
import { Storage } from '@ionic/storage';
import * as $ from 'jquery';

declare var google: any;

@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})
export class HomePage {
	private storage: Storage;
	private toastCtrl: ToastController;
	private modalCtrl: ModalController;
	private geolocation: Geolocation;
	private platform: Platform;
	private currentLocation: IPosition;	
	private map: any;

	private filters: ISearchFilters;
	private currentMarkers: any[];
	private locations: IMarker[];

	search: string = "";

	constructor(platform: Platform, storage: Storage, geolocation: Geolocation, modalCtrl: ModalController, toastCtrl: ToastController) {
		this.platform = platform;
		this.storage = storage;
		this.toastCtrl = toastCtrl;
		this.geolocation = geolocation;
		this.modalCtrl = modalCtrl;

		this.locations = [];
		this.currentMarkers = [];
		this.filters = {
			radius: 10,
			noEligibility: false,
			favoriteOnly: false
		};
	}
  
	ionViewDidLoad() {
		console.log("Running on mobile: " + this.isMobile());

		const callback = pos => {
			this.currentLocation = {
				lat: pos.coords.latitude,
				lng: pos.coords.longitude
			};

			$.ajax({
				type: 'GET',
				url: 'https://foodable.app/rest/locations',
				data: {
					lat: this.currentLocation.lat,
					lng: this.currentLocation.lng,
					radius: 100
				},
				success: data => {
					data.forEach(marker => {
						this.locations.push(marker);
					});

					this.loadMap();
				},
				error: data => {
					this.toastCtrl.create({
						message: 'Could not get locations, please try again later!',
						duration: 3000
					}).present();
				}
			});
			if(this.isMobile()) {
				this.storage.get('favorites').then(val => {
					val.forEach(favorite => {
						this.locations.forEach(location => {
							if(location.position.lat === favorite.lat && location.position.lng === favorite.lng) {
								location.isFavorite = true;
							}
						});
					});
	
					this.loadMap();
				}).catch(error => {
					this.storage.set('favorites', []);
				});
			} else {
				this.loadMap();
			}
		};
		const error = error => {
			this.toastCtrl.create({
				message: 'Foodable needs acces your location to work. Please enable location permissions.',
				duration: 10000
			}).present();
		};

		if(this.isMobile()) {
			this.geolocation.getCurrentPosition().then(callback).catch(error);
		} else {
			if(navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(callback, error);
			} else {
				error(null);
			}
		}
	}

	onSearch() {
		let newLocations: IMarker[] = [];
		let optimizedSearch = this.search.toLowerCase().trim();
		this.locations.forEach(x => {
			if(x.optimizedName.includes(optimizedSearch)) {
				newLocations.push(x);
			}
		});

		if(newLocations.length !== 0) {
			if(this.isMobile()) {
				this.map.clear();

				let bounds = new LatLngBounds();
				newLocations.forEach(marker => {
					bounds.extend(marker.position);
				});
				this.map.moveCamera({
					target: bounds
				});
				this.map.setCameraZoom(Math.min(this.map.getCameraZoom(), 12));
			} else {
				this.currentMarkers.forEach(marker => {
					marker.setMap(null);
				});

				let bounds = new google.maps.LatLngBounds();
				newLocations.forEach(marker => {
					bounds.extend(marker.position);
				});
				this.map.fitBounds(bounds);
				this.map.setZoom(Math.min(this.map.getZoom(), 12));
			}

			this.currentMarkers.length = 0;
			newLocations.forEach(marker => this.addMarker(marker));
		} else {
			$.ajax({
				type: 'GET',
				url: 'http://maps.googleapis.com/maps/api/geocode/json',
				data: {
					address: this.search
				},
				success: data => {
					let result: IPosition = data.results[0].geometry.location;
					if(this.isMobile()) {
						this.locations.forEach(marker => {
							let distance = Spherical.computeDistanceBetween(marker.position, result);
							if(distance / 1609.34 <= this.filters.radius) { // convert from meters to miles
								if(!this.filters.noEligibility || marker.eligibilityUrl === null) {
									if(!this.filters.favoriteOnly || marker.isFavorite) {
										newLocations.push(marker);
									}
								}
							}
						});

						if(newLocations.length == 0) {
							this.toastCtrl.create({
								message: "No nearby food locations found",
								duration: 3000
							}).present();
						} else {
							this.map.clear();

							let bounds = new LatLngBounds();
							bounds.extend(result);
							newLocations.forEach(marker => {
								bounds.extend(marker.position);
							});
							this.map.moveCamera({
								target: bounds
							});
							this.map.setCameraZoom(Math.min(this.map.getCameraZoom(), 12));

							newLocations.forEach(marker => this.addMarker(marker));
							this.currentMarkers.length = 0;
						}
					} else {
						this.locations.forEach(marker => {
							let distance = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(marker.position.lat, marker.position.lng), new google.maps.LatLng(result.lat, result.lng));
							if(distance / 1609.34 <= this.filters.radius) { // convert from meters to miles
								if(!this.filters.noEligibility || marker.eligibilityUrl === null) {
									if(!this.filters.favoriteOnly || marker.isFavorite) {
										newLocations.push(marker);
									}
								}
							}
						});

						if(newLocations.length == 0) {
							this.toastCtrl.create({
								message: "No nearby food locations found",
								duration: 3000
							}).present();
						} else {
							this.currentMarkers.forEach(marker => {
								marker.setMap(null);								
							});
							this.currentMarkers.length = 0;

							let bounds = new google.maps.LatLngBounds();
							bounds.extend(result);
							newLocations.forEach(marker => {
								bounds.extend(marker.position);
							});
							this.map.fitBounds(bounds);
							this.map.setZoom(Math.min(this.map.getZoom(), 12));

							newLocations.forEach(marker => this.addMarker(marker));
						}
					}
				},
				error: data => {
					this.toastCtrl.create({
						message: "An error occured while searching",
						duration: 3000
					}).present();
				}
			});
		}
	}
  
	loadMap() {
		const mapElement = document.getElementById('map-canvas');
		const zoom = 12;
		const defaultPosition = {
			lat: 32.7157,
			lng: -117.1611
		};

		if(this.isMobile()) {
			const mapOptions: GoogleMapOptions = {
				camera: {
					target: defaultPosition,
					zoom: zoom
				}
			};
			console.log("GoogleMaps.create");
			this.map = GoogleMaps.create(mapElement, mapOptions);
			console.log(this.map);
		} else {
			this.map = new google.maps.Map(mapElement, {
				zoom: zoom,
				center: defaultPosition,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			});

			google.maps.event.addListenerOnce(this.map, 'idle', () => {
				google.maps.event.trigger(this.map, 'resize');
				mapElement.classList.add('show-map');
			});
		}

		console.log(this.map);
		console.log("mobile: " + this.isMobile());
		this.locations.forEach(x => this.addMarker(x));

		if(this.isMobile()) {
			this.map.setMyLocationEnabled(true);						
		} else {
			new google.maps.Marker({
				clickable: false,
				icon: new google.maps.MarkerImage('//maps.gstatic.com/mapfiles/mobile/mobileimgs2.png', new google.maps.Size(22,22), new google.maps.Point(0,18), new google.maps.Point(11,11)),
				shadow: null,
				zIndex: 999,
				map: this.map,
				position: new google.maps.LatLng(this.currentLocation.lat, this.currentLocation.lng)
			});
		}
		this.setMapCenter(this.currentLocation);		
	}

	onSearchFocus() {
		if(this.isMobile()) {
			this.map.setVisible(false);
		}
	}

	onSearchBlur() {
		if(this.isMobile()) {
			this.map.setVisible(true);
		}
	}

	onClick(marker: IMarker) {
		this.modalCtrl.create(LearnMore, {
			marker: {
				...marker,
				eligibilityUrl: marker.eligibilityUrl || '#'
			},
			rawPhone: 'tel:' + marker.phoneNumber.replace(/[ \(\)-]/g, ''),
			googleMapsUrl: 'https://www.google.com/maps/search/' + (marker.street + ', ' + marker.city + ' ' + marker.zip).replace(' ', '+'),
			locations: this.locations,
			toggleFavorite: (marker: IMarker) => {
				this.locations.forEach(location => {
					if(location.position.lat == marker.position.lat && location.position.lng == marker.position.lng) {
						location.isFavorite = !location.isFavorite;

						this.currentMarkers.forEach(currentMarker => {
							if(currentMarker.getPosition().lat == location.position.lat && currentMarker.getPosition().lng == location.position.lng) {
								currentMarker.setIcon(!location.isFavorite ? 'red' : 'blue');
							}
						});
					}
				});
			}
		}).present();
	}

	onFilter() {
		this.modalCtrl.create(FilterSearch, {
			filters: this.filters
		}).present();
	}

	isMobile(): boolean {
		return this.platform.is('cordova') === true;
	}

	setMapCenter(pos: IPosition) {
		if(this.isMobile()) {
			this.map.moveCamera({
				target: pos
			});
		} else {
			this.map.setCenter(pos);
		}
	}

	getDirections(marker: IMarker) {
		window.open('https://www.google.com/maps/dir/' + this.currentLocation.lat + ',' + this.currentLocation.lng + '/' + (marker.street + ', ' + marker.city + ' ' + marker.zip).replace(' ', '+'), '_blank');
	}

	addMarker(marker: IMarker) {
		const next = {
			position: marker.position,
			animation: null,
			draggable: false,
		};

		const urlString = marker.url !== null ? '<a target="_blank" href="' + marker.url + '">' + marker.name + '</a>' : marker.name;
		const eligibilityString = marker.eligibilityUrl !== null ? '<a target="_blank" href="' + marker.eligibilityUrl + '">' + marker.eligibility + '</a>' : marker.eligibility;
		const getDirections = event => this.getDirections(marker);
		
		if(this.isMobile()) {
			this.map.addMarker({
				...next,
				icon: marker.isFavorite ? 'blue' : 'red',				
				disableAutoPan: true
			}).then((added: Marker) => {
				this.currentMarkers.push(added);
				let onClick = event => this.onClick(marker);
				
				added.on(GoogleMapsEvent.MARKER_CLICK).subscribe(() => {
					let visibleRegion = this.map.getVisibleRegion();
					let offset = (visibleRegion.northeast.lat - visibleRegion.southwest.lat) / 2 * 0.5;

					this.map.animateCamera({
						target: {
							lat: marker.position.lat + offset,
							lng: marker.position.lng
						},
						bearing: 0,
						tilt: 0,
						duration: 500
					});

					let htmlInfoWindow = document.getElementById('HtmlInfoWindow-Mobile');
					htmlInfoWindow = htmlInfoWindow.cloneNode(true) as HTMLElement;
					htmlInfoWindow.innerHTML = htmlInfoWindow.innerHTML
						.replace('[TITLE]', urlString)
						.replace(/\[STAR_ICON\]/g, marker.isFavorite ? 'star' : 'star-outline');

					const infoWindow = new HtmlInfoWindow();
					infoWindow.setContent(htmlInfoWindow.innerHTML, {
						width: '300px',
						height: '250px'
					});
					infoWindow.open(added);

					document.addEventListener('HtmlInfoWindow-Learn', onClick);
					document.addEventListener('HtmlInfoWindow-Directions', getDirections);									
				});
				added.on(GoogleMapsEvent.INFO_CLOSE).subscribe(() => {
					document.removeEventListener('HtmlInfoWindow-Learn', onClick);	
					document.removeEventListener('HtmlInfoWindow-Directions', getDirections);				
				});
			});
		} else {
			let htmlInfoWindow = document.getElementById('HtmlInfoWindow-Desktop');
			htmlInfoWindow = htmlInfoWindow.cloneNode(true) as HTMLElement;
			htmlInfoWindow.innerHTML = htmlInfoWindow.innerHTML
				.replace('[TITLE]', urlString)
				.replace('[ORG_URL]', marker.orgUrl)
				.replace('assets/imgs/logo.png', marker.orgImage)
				.replace('[GOOGLE_MAPS_URL]', 'https://www.google.com/maps/search/' + (marker.street + ', ' + marker.city + ' ' + marker.zip).replace(' ', '+'))
				.replace('[LOCATION]', marker.street + ', ' + marker.city + ' ' + marker.zip)
				.replace('[FOODS]', marker.foods)
				.replace('[HOURS]', marker.hours)
				.replace('[PHONE]', marker.phoneNumber)
				.replace('[RAWPHONE]', marker.phoneNumber.replace(/[ \(\)-]/g, ''))
				.replace('[CLOSURES]', marker.closures)
				.replace('[ELIGIBILITY]', eligibilityString);

			const mapsMarker = new google.maps.Marker({
				...next,
				map: this.map
			});
			mapsMarker.addListener('click', () => {
				this.map.panTo(mapsMarker.getPosition());

				let infoWindow = new google.maps.InfoWindow({
					content: htmlInfoWindow.innerHTML
				});
				infoWindow.open(this.map, mapsMarker);
				document.addEventListener('HtmlInfoWindow-Directions', getDirections);

				google.maps.event.addListenerOnce(infoWindow, 'closeclick', () => {
					document.removeEventListener('HtmlInfoWindow-Directions', getDirections);
				});
			});
			this.currentMarkers.push(mapsMarker);
		}
	}
}

export interface IMarker {
	name: string,
	orgUrl: string,
	orgImage: string,
	isFavorite: boolean,
	street: string,
	city: string,
	zip: number,
	optimizedName: string,
	url: string | null,
	foods: string,
	hours: string,
	phoneNumber: string,
	closures: string,
	eligibility: string,
	eligibilityUrl: string | null,
	position: IPosition
}

export interface ISearchFilters {
	radius: number,
	noEligibility: boolean,
	favoriteOnly: boolean
}

export interface IPosition {
	lat: number,
	lng: number
}