import { Component } from '@angular/core';
import { Platform, MenuController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { AboutPage } from '../pages/about/about';
@Component({
	templateUrl: 'app.html'
})
export class MainApp {
	rootPage: any = HomePage;

	private menuCtrl: MenuController;
	private platform: Platform;

	constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, menuCtrl: MenuController) {
		this.menuCtrl = menuCtrl;
		this.platform = platform;

		platform.ready().then(() => {
			if(this.isMobile()) {
				statusBar.styleDefault();
				splashScreen.hide();
			} else if(this.isMobileBrowser()) {
				window.location.href = "https://foodable.app/mobile";
			}
 		});
	}

	findFood() {
		this.rootPage = HomePage;
		this.menuCtrl.close();
	}

	about() {
		this.rootPage = AboutPage;
		this.menuCtrl.close();
	}

	isMobile(): boolean {
		return this.platform.is('cordova') === true;
	}

	isMobileBrowser(): boolean {
		return !this.isMobile() && (navigator.userAgent.includes('Android') || /iPod|iPad|iPhone/.test(navigator.userAgent));
	}
}