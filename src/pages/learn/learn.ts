import { Component, Input,  } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { IMarker, IPosition } from '../home/home';
import * as $ from 'jquery';

@Component({
	selector: 'learn-more',
	templateUrl: 'learn.html'
})
export class LearnMore {
	private storage: Storage;
	private viewCtrl: ViewController;

	@Input() locations: IMarker[];
	@Input() marker: IMarker;
	@Input() rawPhone: string;
	@Input() googleMapsUrl: string;
	@Input() toggleFavorite: any;
	
	constructor(viewCtrl: ViewController, params: NavParams, storage: Storage) {
		this.viewCtrl = viewCtrl;
		this.storage = storage;

		this.toggleFavorite = params.get('toggleFavorite');
		this.locations = params.get('locations');
		this.marker = params.get('marker');
		this.rawPhone = params.get('rawPhone');
		this.googleMapsUrl = params.get('googleMapsUrl');
	}

	closeModal() {
		this.viewCtrl.dismiss();
	}

	onFavorite() {
		let oldStar = this.marker.isFavorite ? 'star' : 'star-outline';
		this.toggleFavorite(this.marker);		
		this.marker.isFavorite = !this.marker.isFavorite;
		let newStar =  this.marker.isFavorite ? 'star' : 'star-outline';
		
		let icon: any = $('#favoriteIcon');
		icon.replaceWith($(icon[0].outerHTML.replace(new RegExp(oldStar, 'g'), newStar)));

		let favorites: IPosition[] = [];
		this.locations.forEach(location => {
			if(location.isFavorite) {
				favorites.push(location.position);
			}
		});
		this.storage.set('favorites', favorites);
	}
}