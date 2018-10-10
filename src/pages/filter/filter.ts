import { Component, Input } from '@angular/core';
import { ViewController, ToastController, NavParams } from 'ionic-angular';
import { ISearchFilters } from '../home/home';

@Component({
	selector: 'filter-search',
	templateUrl: 'filter.html'
})
export class FilterSearch {
	private toastCtrl: ToastController;	
	private viewCtrl: ViewController;

	@Input() filters: ISearchFilters;
	@Input() organizations: string[];
	@Input() setFilters: any;
	@Input() isMobile: boolean;

	radius: string;
	noEligibility: boolean;
	favoriteOnly: boolean;
	organization: string;
	visibleOnly: boolean;
	
	constructor(viewCtrl: ViewController, toastCtrl: ToastController, params: NavParams) {
		this.viewCtrl = viewCtrl;
		this.toastCtrl = toastCtrl;

		this.filters = params.get('filters');
		this.organizations = params.get('organizations');
		this.setFilters = params.get('setFilters');
		this.isMobile = params.get('isMobile');

		this.radius = this.filters.radius.toString();
		this.noEligibility = this.filters.noEligibility;
		this.favoriteOnly = this.filters.favoriteOnly;
		this.organization = this.filters.organization || '[Any Organization]';
		this.visibleOnly = this.filters.visibleOnly;
	}

	closeModal() {
		let radius;
		try {
			radius = parseInt(this.radius);
		} catch {
			this.toastCtrl.create({
				message: "invalid radius",
				duration: 3000
			}).present();
			return;
		}
		this.filters.noEligibility = this.noEligibility;
		this.filters.favoriteOnly = this.favoriteOnly;
		this.filters.radius = radius;
		this.filters.organization = this.organization == '[Any Organization]' ? null : this.organization;
		this.filters.visibleOnly = this.visibleOnly;

		this.setFilters(this.filters);

		this.viewCtrl.dismiss();
	}
}